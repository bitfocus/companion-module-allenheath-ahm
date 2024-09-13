import * as Helpers from './helpers.js'
import * as Constants from './constants.js'

const PRESET_COUNT = 500;

export function getActions() {
	let actions = {}

	this.listOptions = (name, qty, offset) => {
		return [
			{
				type: 'dropdown',
				label: name,
				id: 'number',
				default: 0,
				choices: Helpers.getChoicesArrayWithIncrementingNumbers(name, qty, offset),
				minChoicesForSearch: 0,
			},
		]
	}

	this.muteOptions = (name, qty, offset) => {
		return [
			{
				type: 'dropdown',
				label: name,
				id: 'inputNum',
				default: 0,
				choices: Helpers.getChoicesArrayWithIncrementingNumbers(name, qty, offset),
				minChoicesForSearch: 0,
			},
			{
				type: 'checkbox',
				label: 'Mute',
				id: 'mute',
				default: true,
			},
		]
	}

	this.setLevelOptions = (name, qty, offset) => {
		return [
			{
				type: 'dropdown',
				label: name,
				id: 'inputNum',
				default: 0,
				choices: Helpers.getChoicesArrayWithIncrementingNumbers(name, qty, offset),
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				label: 'Set Level (dBu)',
				id: 'level',
				default: '0',
				choices: Helpers.getChoicesArrayOf1DArray(Constants.dbu_Values)
			}
		]
	}

	this.incDecOptions = (name, qty, offset) => {
		return [
			{
				type: 'dropdown',
				label: name,
				id: 'inputNum',
				default: 0,
				choices: Helpers.getChoicesArrayWithIncrementingNumbers(name, qty, offset),
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				label: 'Increment/Decrement',
				id: 'incdec',
				default: 'inc',
				choices: [
					{ id: 'inc', label: 'Increment' },
					{ id: 'dec', label: 'Decrement' },
				],
			}
		]
	}

	actions['mute_input'] = {
		name: 'Mute Input',
		options: this.muteOptions('Input', this.numberOfInputs, -1),
		callback: (action) => {
			let channel = parseInt(action.options.inputChannel)

			let buffers = [Buffer.from([0x90, channel, action.options.mute ? 0x7f : 0x3f, 0x90, channel, 0])]

			this.sendCommand(buffers)
			this.inputsMute[channel] = action.options.mute ? 1 : 0
		},
	}

	actions['mute_zone'] = {
		name: 'Mute Zone',
		options: this.muteOptions('Zone', this.numberOfInputs, -1),
		callback: (action) => {
			let channel = parseInt(action.options.inputChannel)

			let buffers = [Buffer.from([0x91, channel, action.options.mute ? 0x7f : 0x3f, 0x91, channel, 0])]
			this.sendCommand(buffers)
			this.zonesMute[channel] = action.options.mute ? 1 : 0
			this.checkFeedbacks('zoneMute')
		},
	}

	actions['preset_recall'] = {
		name: 'Recall Preset',
		options: this.listOptions('Preset', PRESET_COUNT, -1),
		callback: (action) => {
			let presetNumber = parseInt(action.options.number)
			let buffers = [
				Buffer.from([
					0xb0,
					0x00,
					presetNumber < 128 ? 0x00 : presetNumber < 256 ? 0x01 : presetNumber < 384 ? 0x02 : 0x03,
					0xc0,
					presetNumber,
				]),
			]
			this.sendCommand(buffers)
		},
	}

	actions['input_to_zone'] = {
		name: 'Mute Input to Zone',
		options: this.muteOptions('Input', this.numberOfInputs, -1).concat(this.listOptions('Zone', this.numberOfZones, -1)),
		callback: (action) => {
			let channel = parseInt(action.options.inputChannel)
			let zoneNumber = parseInt(action.options.number)

			let buffers = [
				Buffer.from([
					0xf0,
					0x00,
					0x00,
					0x1a,
					0x50,
					0x12,
					0x01,
					0x00,
					0x00,
					0x03,
					channel,
					0x01,
					zoneNumber,
					action.options.mute ? 0x7f : 0x3f,
					0xf7,
				]),
			]
			this.sendCommand(buffers)
			if (this.inputsToZonesMute[channel + 1]?.[zoneNumber + 1]) {
				this.inputsToZonesMute[channel + 1][zoneNumber + 1] = action.options.mute ? 1 : 0
			} else {
				this.inputsToZonesMute[channel + 1] = {}
				this.inputsToZonesMute[channel + 1][zoneNumber + 1] = action.options.mute ? 1 : 0
			}

			this.checkFeedbacks('inputToZoneMute')
		},
	}

	actions['set_level_input'] = {
		name: 'Set Level of Input',
		options: this.setLevelOptions('Input', this.numberOfInputs, -1),
		callback: (action) => {
			let inputNum = parseInt(action.options.inputNum)
			let levelDec = parseInt(action.options.level)

			let buffers = [Buffer.from([0xB0, 0x63, inputNum, 0xB0, 0x62, 0x17, 0xB0, 0x06, levelDec])]
			this.sendCommand(buffers)

			// send "Get Channel Level" command so the response triggers the variable to be updated
			//buffers = [Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12,	0x01, 0x00, 0x00, 0x01, 0x0b, 0x17, inputNum, 0xf7])]
			//this.sendCommand(buffers)
			// does not work, since the device can somehow not handle two commands quickly after another

			// manually set variable value, increment Num because it starts at 0 instead of 1
			this.setVariableValues({ [Helpers.getVarNameInputLevel(inputNum+1)]: this.getDbuValue(levelDec) })
		},
	}

	actions['inc_dec_level_input'] = {
		name: 'Increment/Decrement Level of Input',
		options: this.incDecOptions('Input', this.numberOfInputs, -1),
		callback: (action) => {
			let inputNum = parseInt(action.options.inputNum)
			let incdecSelector = action.options.incdec == 'inc' ? 0x7F : 0x3F;

			let buffers = [Buffer.from([0xB0, 0x63, inputNum, 0xB0, 0x62, 0x20, 0xB0, 0x06, incdecSelector])]
			this.sendCommand(buffers)
		},
	}

	// actions['get_phantom'] = {
	// 	name: 'Get phantom info',
	// 	options: this.listOptions('Input', 64, -1),
	//callback: (action) => {}
	// }

	return actions
}
