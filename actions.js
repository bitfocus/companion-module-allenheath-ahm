import * as Helpers from './helpers.js'
import * as Constants from './constants.js'

const PRESET_COUNT = 500;
const PLAYBACK_COUNT = 127;

export function getActions() {
	let actions = {}

	this.listOptions = (name, qty, offset) => {
		return [
			{
				type: 'dropdown',
				id: 'number',
				label: name,
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
				id: 'mute_number',
				label: name,
				default: 0,
				choices: Helpers.getChoicesArrayWithIncrementingNumbers(name, qty, offset),
				minChoicesForSearch: 0,
			},
			{
				type: 'checkbox',
				id: 'mute',
				label: 'Mute',
				default: true,
			},
		]
	}

	this.setLevelOptions = (name, qty, offset) => {
		return [
			{
				type: 'dropdown',
				id: 'number',
				label: name,
				default: 0,
				choices: Helpers.getChoicesArrayWithIncrementingNumbers(name, qty, offset),
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				id: 'level',
				label: 'Set Level (dBu)',
				default: '0',
				choices: Helpers.getChoicesArrayOf1DArray(Constants.dbu_Values)
			}
		]
	}

	this.incDecOptions = (name, qty, offset) => {
		return [
			{
				type: 'dropdown',
				id: 'number',
				label: name,
				default: 0,
				choices: Helpers.getChoicesArrayWithIncrementingNumbers(name, qty, offset),
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				id: 'incdec',
				label: 'Increment/Decrement',
				default: 'inc',
				choices: [
					{ id: 'inc', label: 'Increment' },
					{ id: 'dec', label: 'Decrement' },
				],
			}
		]
	}

	this.playbackChannelOptions = (name) => {
		return [
			{
				type: 'dropdown',
				id: 'playbackChannel',
				label: name,
				default: 0,
				choices: Helpers.getChoicesArrayOfKeyValueObject(Constants.PlaybackChannel),
				minChoicesForSearch: 0,
			}
		]
	}

	// action: action of callback
	// type: 0 for input, 1 for zone
	this.setLevelCallback = async (action, type) => {
		if(type != Constants.ChannelType.Input && type != Constants.ChannelType.Zone) {
			return;
		}

		let typeCodeSetLevel = parseInt(0xB0 + type)  // type code for Command "Channel Level"
		let typeCodeGetLevel = parseInt(0x00 + type)  // type code for Command "Get Channel Level"
		let chNumber = parseInt(action.options.number)
		let levelDec = parseInt(action.options.level)

		let buffers = [Buffer.from([typeCodeSetLevel, 0x63, chNumber, typeCodeSetLevel, 0x62, 0x17, typeCodeSetLevel, 0x06, levelDec])]
		this.sendCommand(buffers)

		// wait until device has processed first command and then send "Get Channel Level" command so the response triggers the variable to be updated
		await this.sleep(150)
		buffers = [Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12,	0x01, 0x00, typeCodeGetLevel, 0x01, 0x0b, 0x17, chNumber, 0xf7])]
		this.sendCommand(buffers)
	}

	this.incDecLevelCallback = async (action, type) => {
		if(type != Constants.ChannelType.Input && type != Constants.ChannelType.Zone) {
			return;
		}

		let typeCodeSetLevel = parseInt(0xB0 + type)  // type code for Command "Level Increment / Decrement"
		let typeCodeGetLevel = parseInt(0x00 + type)  // type code for Command "Get Channel Level"
		let chNumber = parseInt(action.options.number)
		let incdecSelector = action.options.incdec == 'inc' ? 0x7F : 0x3F;

		let buffers = [Buffer.from([typeCodeSetLevel, 0x63, chNumber, typeCodeSetLevel, 0x62, 0x20, typeCodeSetLevel, 0x06, incdecSelector])]
		this.sendCommand(buffers)

		// wait until device has processed first command and then send "Get Channel Level" command so the response triggers the variable to be updated
		await this.sleep(150)
		buffers = [Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12,	0x01, 0x00, typeCodeGetLevel, 0x01, 0x0b, 0x17, chNumber, 0xf7])]
		this.sendCommand(buffers)
	}

	actions['mute_input'] = {
		name: 'Mute Input',
		options: this.muteOptions('Input', this.numberOfInputs, -1),
		callback: (action) => {
			let inputNumber = parseInt(action.options.mute_number)

			let buffers = [Buffer.from([0x90, inputNumber, action.options.mute ? 0x7f : 0x3f, 0x90, inputNumber, 0])]

			this.sendCommand(buffers)
			this.inputsMute[inputNumber] = action.options.mute ? 1 : 0
			this.checkFeedbacks('inputMute')
		},
	}

	actions['mute_zone'] = {
		name: 'Mute Zone',
		options: this.muteOptions('Zone', this.numberOfInputs, -1),
		callback: (action) => {
			let zoneNumber = parseInt(action.options.mute_number)

			let buffers = [Buffer.from([0x91, zoneNumber, action.options.mute ? 0x7f : 0x3f, 0x91, zoneNumber, 0])]

			this.sendCommand(buffers)
			this.zonesMute[zoneNumber] = action.options.mute ? 1 : 0
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

	actions['playback_track'] = {
		name: 'Playback Track',
		options: this.listOptions('Playback Track', PLAYBACK_COUNT, -1).concat(this.playbackChannelOptions('Playback Channel')),
		callback: (action) => {
			let trackNumber = parseInt(action.options.number)
			let playbackChannel = parseInt(action.options.playbackChannel)

			console.log(`action playback_track: Got Callback with paramters Tracknumer: ${action.options.number} and playbackChannel ${action.options.playbackChannel}. PlaybackChannel is Stereo = ${action.options.playbackChannel == Constants.PlaybackChannel.Stereo}`)

			let buffers = [
				Buffer.from([
					0xf0, 0x00,	0x00, 0x1a,	0x50, 0x12, 0x01, 0x00,
					0x00, 0x06, playbackChannel, trackNumber, 0xF7
				]),
			]

			// TODO does not yet work!
			// overwrite buffers and leave playback channel byte away if stereo is chosen
			// if(action.options.playbackChannel == Constants.PlaybackChannel.Stereo) {
			// 	buffers = [
			// 		Buffer.from([
			// 			0xf0, 0x00,	0x00, 0x1a,	0x50, 0x12, 0x01, 0x00,
			// 			0x00, 0x06, 0x10, trackNumber, 0xF7
			// 		]),
			// 	]
			// } 

			this.sendCommand(buffers)
		},
	}

	actions['input_to_zone'] = {
		name: 'Mute Input to Zone',
		options: this.muteOptions('Input', this.numberOfInputs, -1).concat(this.listOptions('Zone', this.numberOfZones, -1)),
		callback: (action) => {
			let inputNumber = parseInt(action.options.mute_number)
			let zoneNumber = parseInt(action.options.number)

			let buffers = [
				Buffer.from([
					0xf0, 0x00,	0x00, 0x1a,	0x50, 0x12, 0x01, 0x00,
					0x00, 0x03, inputNumber, 0x01, zoneNumber, action.options.mute ? 0x7f : 0x3f, 0xf7,
				]),
			]
			this.sendCommand(buffers)
			if (this.inputsToZonesMute[inputNumber + 1]?.[zoneNumber + 1]) {
				this.inputsToZonesMute[inputNumber + 1][zoneNumber + 1] = action.options.mute ? 1 : 0
			} else {
				this.inputsToZonesMute[inputNumber + 1] = {}
				this.inputsToZonesMute[inputNumber + 1][zoneNumber + 1] = action.options.mute ? 1 : 0
			}

			this.checkFeedbacks('inputToZoneMute')
		},
	}

	actions['set_level_input'] = {
		name: 'Set Level of Input',
		options: this.setLevelOptions('Input', this.numberOfInputs, -1),
		callback: async (action) => { this.setLevelCallback(action, Constants.ChannelType.Input) }
	}

	actions['inc_dec_level_input'] = {
		name: 'Increment/Decrement Level of Input',
		options: this.incDecOptions('Input', this.numberOfInputs, -1),
		callback: async (action) => { this.incDecLevelCallback(action, Constants.ChannelType.Input) }
	}

	actions['set_level_zone'] = {
		name: 'Set Level of Zone',
		options: this.setLevelOptions('Zone', this.numberOfZones, -1),
		callback: async (action) => { this.setLevelCallback(action, Constants.ChannelType.Zone) }
	}

	actions['inc_dec_level_zone'] = {
		name: 'Increment/Decrement Level of Zone',
		options: this.incDecOptions('Input', this.numberOfZones, -1),
		callback: async (action) => { this.incDecLevelCallback(action, Constants.ChannelType.Zone) }
	}

	// actions['get_phantom'] = {
	// 	name: 'Get phantom info',
	// 	options: this.listOptions('Input', 64, -1),
	//callback: (action) => {}
	// }

	return actions
}
