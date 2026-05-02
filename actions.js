import { getChoicesArrayWithIncrementingNumbers, 
	getChoicesArrayOf1DArray, 
	getChoicesArrayOfKeyValueObject, 
	checkIfValueOfEnum,
	getChTypeOfSendType,
	getSendChTypeOfSendType,
	sleep
 } from './src/utility/helpers.js'
import { dbu_Values,
	PlaybackChannel,
	ChannelType,
	SendType
 } from './src/utility/constants.js'
import { requestLevelInfo, requestMuteInfo } from './src/utility/formatRequest.js'

const PRESET_COUNT = 500
const PLAYBACK_COUNT = 127

function listOptions(name, qty, offset) {
	return [
		{
			type: 'dropdown',
			id: 'number',
			label: name,
			default: 0,
			choices: getChoicesArrayWithIncrementingNumbers(name, qty, offset),
			minChoicesForSearch: 0,
		},
	]
}

function muteOptions(name, qty, offset) {
	return [
		{
			type: 'dropdown',
			id: 'mute_number',
			label: name,
			default: 0,
			choices: getChoicesArrayWithIncrementingNumbers(name, qty, offset),
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

function setLevelOptions(name, qty, offset) {
	return [
		{
			type: 'dropdown',
			id: 'setlvl_ch_number',
			label: name,
			default: 0,
			choices: getChoicesArrayWithIncrementingNumbers(name, qty, offset),
			minChoicesForSearch: 0,
		},
		{
			type: 'dropdown',
			id: 'level',
			label: 'Set Level (dBu)',
			default: '0',
			choices: getChoicesArrayOf1DArray(dbu_Values),
		},
	]
}

function incDecOptions(name, qty, offset) {
	return [
		{
			type: 'dropdown',
			id: 'incdec_ch_number',
			label: name,
			default: 0,
			choices: getChoicesArrayWithIncrementingNumbers(name, qty, offset),
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
		},
	]
}

function playbackChannelOptions(name) {
	return [
		{
			type: 'dropdown',
			id: 'playbackChannel',
			label: name,
			default: 0,
			choices: getChoicesArrayOfKeyValueObject(PlaybackChannel),
			minChoicesForSearch: 0,
		},
	]
}

// action: action of callback
// type: 0 for input, 1 for zone
async function setLevelCallback(action, type) {
	if (checkIfValueOfEnum(type, ChannelType) == false) {
		return
	}

	let typeCodeSetLevel = parseInt(0xb0 + type) // type code for Command "Channel Level"
	let typeCodeGetLevel = parseInt(0x00 + type) // type code for Command "Get Channel Level"
	let chNumber = parseInt(action.options.setlvl_ch_number)
	let levelDec = parseInt(action.options.level)

	return [
		Buffer.from([typeCodeSetLevel, 0x63, chNumber, typeCodeSetLevel, 0x62, 0x17, typeCodeSetLevel, 0x06, levelDec]),
	]
}

async function incDecLevelCallback(action, type) {
	if (checkIfValueOfEnum(type, ChannelType) == false) {
		return
	}

	let typeCodeSetLevel = parseInt(0xb0 + type) // type code for Command "Level Increment / Decrement"
	let typeCodeGetLevel = parseInt(0x00 + type) // type code for Command "Get Channel Level"
	let chNumber = parseInt(action.options.incdec_ch_number)
	let incdecSelector = action.options.incdec == 'inc' ? 0x7f : 0x3f

	return [
		Buffer.from([
			typeCodeSetLevel,
			0x63,
			chNumber,
			typeCodeSetLevel,
			0x62,
			0x20,
			typeCodeSetLevel,
			0x06,
			incdecSelector,
		]),
	]
}

async function incDecSendLevelCallback(action, type) {
	if (checkIfValueOfEnum(type, SendType) == false) {
		return
	}

	let chType = getChTypeOfSendType(type)
	let sendChType = getSendChTypeOfSendType(type)
	let chNumber = parseInt(action.options.incdec_ch_number)
	let sendChNumber = parseInt(action.options.number)
	let incdecSelector = action.options.incdec == 'inc' ? 0x7f : 0x3f

	return [
		Buffer.from([
			0xf0,
			0x00,
			0x00,
			0x1a,
			0x50,
			0x12,
			0x01,
			0x00,
			chType,
			0x04,
			chNumber,
			sendChType,
			sendChNumber,
			incdecSelector,
			0xf7,
		]),
	]
}

export function getActions(tcpClient, state, numberOfInputs, numberOfZones, { companion }) {
	let actions = {}

	actions['mute_input'] = {
		name: 'Mute Input',
		options: muteOptions('Input', numberOfInputs, -1),
		callback: (action) => {
			let inputNumber = parseInt(action.options.mute_number)
			let buffers = [Buffer.from([0x90, inputNumber, action.options.mute ? 0x7f : 0x3f, 0x90, inputNumber, 0])]

			tcpClient.sendCommand(buffers)
			sleep(150)
			
			buffers = requestMuteInfo(ChannelType.Input, action.options.mute_number)
			console.log(buffers, action.options.mute_number)
			tcpClient.sendCommand(buffers)
			// state.setChannel(ChannelType.Input, inputNumber, undefined, action.options.mute)
			// companion.checkFeedbacks('inputMute')
		},
	}

	actions['mute_zone'] = {
		name: 'Mute Zone',
		options: muteOptions('Zone', numberOfInputs, -1),
		callback: (action) => {
			let zoneNumber = parseInt(action.options.mute_number)
			let mute = action.options.mute
			let buffers = [Buffer.from([0x91, zoneNumber, action.options.mute ? 0x7f : 0x3f, 0x91, zoneNumber, 0])]

			tcpClient.sendCommand(buffers)
			state.setChannel('zone', zoneNumber, undefined, mute)
			companion.checkFeedbacks('zoneMute')
		},
	}

	actions['preset_recall'] = {
		name: 'Recall Preset',
		options: listOptions('Preset', PRESET_COUNT, -1),
		callback: (action) => {
			// note: presetNumber is one less than the actual preset number, since the action list starts at 0
			let presetNumber = parseInt(action.options.number) 
			let bank = Math.floor(presetNumber / 128)
			let presetOffset = presetNumber % 128
 			let buffers = [
				Buffer.from([
					0xb0,
					0x00,
					bank,
					0xc0,
					presetOffset,
				]),
			]
			tcpClient.sendCommand(buffers)
		},
	}

	actions['playback_track'] = {
		name: 'Playback Track',
		options: listOptions('Playback Track', PLAYBACK_COUNT, -1).concat(
			playbackChannelOptions('Playback Channel'),
		),
		callback: (action) => {
			let trackNumber = parseInt(action.options.number)
			let playbackChannel = parseInt(action.options.playbackChannel)

			// console.log(`action playback_track: Got Callback with parameters trackNumber: ${action.options.number} and playbackChannel ${action.options.playbackChannel}.`)

			let buffers = [
				Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, 0x00, 0x06, playbackChannel, trackNumber, 0xf7]),
			]

			tcpClient.sendCommand(buffers)
		},
	}

	actions['input_to_zone'] = {
		name: 'Mute Input to Zone',
		options: muteOptions(ChannelType.Input, numberOfInputs, -1).concat(
			listOptions('Zone', numberOfZones, -1),
		),
		callback: (action) => {
			let inputNumber = parseInt(action.options.mute_number)
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
					inputNumber,
					0x01,
					zoneNumber,
					action.options.mute ? 0x7f : 0x3f,
					0xf7,
				]),
			]
			tcpClient.sendCommand(buffers)

			// manually update internal state, (internal state works with user-number, hence + 1)
			this.updateSendMuteState(
				SendType.InputToZone,
				inputNumber + 1,
				zoneNumber + 1,
				action.options.mute ? 1 : 0,
			)

			companion.checkFeedbacks('inputToZoneMute')
		},
	}

	actions['set_level_input'] = {
		name: 'Set Level of Input',
		options: setLevelOptions(ChannelType.Input, numberOfInputs, -1),
		callback: async (action) => {
			let buffers = setLevelCallback(action, ChannelType.Input)
			tcpClient.sendCommand(buffers)
			await sleep(150)
			tcpClient.sendCommand(requestLevelInfo(ChannelType.Input, action.options.setlvl_ch_number))
		},
	}

	actions['inc_dec_level_input'] = {
		name: 'Increment/Decrement Level of Input',
		options: incDecOptions(ChannelType.Input, numberOfInputs, -1),
		callback: async (action) => {
			let buffers = incDecLevelCallback(action, ChannelType.Input)
			tcpClient.sendCommand(buffers)
			await sleep(150)
			tcpClient.sendCommand(requestLevelInfo(ChannelType.Input, action.options.setlvl_ch_number))
		},
	}

	actions['set_level_zone'] = {
		name: 'Set Level of Zone',
		options: setLevelOptions('Zone', numberOfZones, -1),
		callback: async (action) => {
			let buffers = setLevelCallback(action, ChannelType.Zone)
			tcpClient.sendCommand(buffers)
			await sleep(150)
			tcpClient.sendCommand(requestLevelInfo(ChannelType.Zone, action.options.setlvl_ch_number))
		},
	}

	actions['inc_dec_level_zone'] = {
		name: 'Increment/Decrement Level of Zone',
		options: incDecOptions('Zone', numberOfZones, -1),
		callback: async (action) => {
			let buffers = incDecLevelCallback(action, ChannelType.Zone)
			tcpClient.sendCommand(buffers)
			await sleep(150)
			tcpClient.sendCommand(requestLevelInfo(ChannelType.Zone, action.options.setlvl_ch_number))
		},
	}

	actions['inc_dec_in_zn_send_level'] = {
		name: 'Increment/Decrement Input to Zone Send Level',
		options: incDecOptions(ChannelType.Input, numberOfInputs, -1).concat(
			listOptions('Zone', numberOfZones, -1),
		),
		callback: async (action) => {
			let buffers = incDecSendLevelCallback(action, SendType.InputToZone)
			tcpClient.sendCommand(buffers)
		},
	}

	actions['inc_dec_zn_zn_send_level'] = {
		name: 'Increment/Decrement Zone to Zone Send Level',
		options: incDecOptions('Zone', numberOfZones, -1).concat(
			listOptions('Zone', numberOfZones, -1),
		),
		callback: async (action) => {
			let buffers = incDecSendLevelCallback(action, SendType.ZoneToZone)
			tcpClient.sendCommand(buffers)
		},
	}

	// Control Group actions
	actions['set_level_controlgroup'] = {
		name: 'Set Level of Control Group',
		options: setLevelOptions('Control Group', 32, -1),
		callback: async (action) => {
			let buffers = setLevelCallback(action, ChannelType.ControlGroup)
			tcpClient.sendCommand(buffers)
		},
	}

	actions['inc_dec_level_controlgroup'] = {
		name: 'Increment/Decrement Level of Control Group',
		options: incDecOptions('Control Group', 32, -1),
		callback: async (action) => {
			incDecLevelCallback(action, ChannelType.ControlGroup)
			tcpClient.sendCommand(buffers)
			await sleep(150)
			tcpClient.sendCommand(requestLevelInfo(ChannelType.ControlGroup, action.options.setlvl_ch_number))

		},
	}

	actions['mute_controlgroup'] = {
		name: 'Mute Control Group',
		options: muteOptions('Control Group', 32, -1),
		callback: (action) => {
			let cgNumber = parseInt(action.options.mute_number)
			let mute = action.options.mute
			let buffers = [Buffer.from([0x92, cgNumber, action.options.mute ? 0x7f : 0x3f, 0x92, cgNumber, 0])]

			tcpClient.sendCommand(buffers)
			state.setChannel('cg', cgNumber, undefined, mute)
			companion.checkFeedbacks('cgMute')
		},
	}

	// actions['get_phantom'] = {
	// 	name: 'Get phantom info',
	// 	options: listOptions(ChannelType.Input, 64, -1),
	//callback: (action) => {}
	// }

	return actions
}
