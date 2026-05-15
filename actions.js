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
	SendType,
	SendInfoType
 } from './src/utility/constants.js'
import { setLevelCallback, incDecLevelCallback, incDecSendLevelCallback, requestSendInfo } from './src/utility/formatHexMIDI.js'
import { requestLevelInfo, requestMuteInfo } from './src/utility/formatHexMIDI.js'

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

export function getActions(tcpClient, state, numberOfInputs, numberOfZones, { companion }) {
	let actions = {}

	actions['mute_input'] = {
		name: 'Mute Input',
		options: muteOptions('Input', numberOfInputs, -1),
		callback: async (action) => {
			let inputNumber = parseInt(action.options.mute_number)
			console.log('Send mute command -- Input: ', action.options.mute_number, action.options.mute)
			let buffers = [Buffer.from([0x90, inputNumber, action.options.mute ? 0x7f : 0x3f, 0x90, inputNumber, 0])]
			tcpClient.queue(buffers)
			
			buffers = requestMuteInfo(ChannelType.Input, action.options.mute_number)
			console.log('Request mute info -- Input: ', buffers, action.options.mute_number)
			tcpClient.queue(buffers)
			
			console.log('checking feedback inputMute')
			companion.checkFeedbacks('inputMute')
		},
	}

	actions['mute_zone'] = {
		name: 'Mute Zone',
		options: muteOptions('Zone', numberOfInputs, -1),
		callback: (action) => {
			let zoneNumber = parseInt(action.options.mute_number)
			console.log('Send mute command -- Input: ', action.options.mute_number, action.options.mute)
			let buffers = [Buffer.from([0x91, zoneNumber, action.options.mute ? 0x7f : 0x3f, 0x91, zoneNumber, 0])]
			tcpClient.queue(buffers)

			buffers = requestMuteInfo(ChannelType.Zone, action.options.mute_number)
			console.log('Request mute info -- Zone: ', buffers, action.options.mute_number)
			tcpClient.queue(buffers)
			
			// state.setChannel(ChannelType.Zone, zoneNumber, undefined, mute)
			console.log('checking feedback zoneMute')
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
			tcpClient.queue(buffers)
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

			tcpClient.queue(buffers)
		},
	}

	actions['input_to_zone'] = {
		name: 'Mute Input to Zone',
		options: muteOptions('Input', numberOfInputs, -1).concat(
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
			tcpClient.queue(buffers)

			// manually update internal state
            state.setSend(ChannelType.Input, inputNumber, zoneNumber, undefined, action.options.mute)
			
			console.log(inputNumber, zoneNumber, SendInfoType.MUTE)
			tcpClient.queue(requestSendInfo(ChannelType.Input, SendInfoType.MUTE, inputNumber, zoneNumber))
			
			companion.checkFeedbacks('inputToZoneMute')
		},
	}

	actions['set_level_input'] = {
		name: 'Set Level of Input',
		options: setLevelOptions(ChannelType.Input, numberOfInputs, -1),
		callback: (action) => {
			tcpClient.queue(setLevelCallback(action, ChannelType.Input))
			tcpClient.queue(requestLevelInfo(ChannelType.Input, action.options.setlvl_ch_number))
		},
	}

	actions['inc_dec_level_input'] = {
		name: 'Increment/Decrement Level of Input',
		options: incDecOptions(ChannelType.Input, numberOfInputs, -1),
		callback: (action) => {
			tcpClient.queue(incDecLevelCallback(action, ChannelType.Input))
			tcpClient.queue(requestLevelInfo(ChannelType.Input, action.options.setlvl_ch_number))
		},
	}

	actions['set_level_zone'] = {
		name: 'Set Level of Zone',
		options: setLevelOptions('Zone', numberOfZones, -1),
		callback: (action) => {
			tcpClient.queue(setLevelCallback(action, ChannelType.Zone))
			tcpClient.queue(requestLevelInfo(ChannelType.Zone, action.options.setlvl_ch_number))
		},
	}

	actions['inc_dec_level_zone'] = {
		name: 'Increment/Decrement Level of Zone',
		options: incDecOptions('Zone', numberOfZones, -1),
		callback: (action) => {
			tcpClient.queue(incDecLevelCallback(action, ChannelType.Zone))
			tcpClient.queue(requestLevelInfo(ChannelType.Zone, action.options.setlvl_ch_number))
		},
	}

	actions['inc_dec_in_zn_send_level'] = {
		name: 'Increment/Decrement Input to Zone Send Level',
		options: incDecOptions(ChannelType.Input, numberOfInputs, -1).concat(
			listOptions('Zone', numberOfZones, -1),
		),
		callback: (action) => {
			tcpClient.queue(incDecSendLevelCallback(action, SendType.InputToZone))
		},
	}

	actions['inc_dec_zn_zn_send_level'] = {
		name: 'Increment/Decrement Zone to Zone Send Level',
		options: incDecOptions('Zone', numberOfZones, -1).concat(
			listOptions('Zone', numberOfZones, -1),
		),
		callback: (action) => {
			tcpClient.queue(incDecSendLevelCallback(action, SendType.ZoneToZone))
		},
	}

	// Control Group actions
	actions['set_level_controlgroup'] = {
		name: 'Set Level of Control Group',
		options: setLevelOptions('Control Group', 32, -1),
		callback: (action) => {
			tcpClient.queue(setLevelCallback(action, ChannelType.ControlGroup))
			tcpClient.queue(requestLevelInfo(ChannelType.ControlGroup, action.options.setlvl_ch_number))

		},
	}

	actions['inc_dec_level_controlgroup'] = {
		name: 'Increment/Decrement Level of Control Group',
		options: incDecOptions('Control Group', 32, -1),
		callback: (action) => {
			tcpClient.queue(incDecLevelCallback(action, ChannelType.ControlGroup))
			tcpClient.queue(requestLevelInfo(ChannelType.ControlGroup, action.options.setlvl_ch_number))

		},
	}

	actions['mute_controlgroup'] = {
		name: 'Mute Control Group',
		options: muteOptions('Control Group', 32, -1),
		callback: async (action) => {
			let cgNumber = parseInt(action.options.mute_number)
			let mute = action.options.mute
			let buffers = [Buffer.from([0x92, cgNumber, action.options.mute ? 0x7f : 0x3f, 0x91, cgNumber, 0])]
			tcpClient.queue(buffers)
			

			buffers = requestMuteInfo(ChannelType.ControlGroup, action.options.mute_number)
			console.log('Request mute info -- Control Group: ', buffers, action.options.mute_number)
			tcpClient.queue(buffers)

			
			// state.setChannel(ChannelType.ControlGroup, cgNumber, undefined, mute)
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
