import { getChoicesArrayOf1DArray, getChoicesArrayOfKeyValueObject } from './utility/helpers.js'
import { ChannelType, SendType, SendInfoType, dbu_Values, PlaybackChannel } from './utility/constants.js'
import { setMute, setLevel, adjustLevel, requestLevelInfo, requestMuteInfo } from './formatMIDI/channels.js'
import { requestSendInfo, adjustSendLevel, setInputToZoneMute } from './formatMIDI/sends.js'
import { setPlaybackTrack } from './formatMIDI/playback.js'
import { recallPreset } from './formatMIDI/presets.js'
import { getContext } from './context.js'
import { FeedbackId } from './feedbacks.js'
import { createLogger } from './utility/log.js'

const PRESET_COUNT = 500
const PLAYBACK_COUNT = 127
const log = createLogger('Actions')
const MUTE_STATE_TIMEOUT_MS = 1000

const MuteOperation = {
	Set: 'set',
	Toggle: 'toggle',
}

export const ActionId = {
	MuteInput: 'mute_input',
	MuteZone: 'mute_zone',
	MuteControlGroup: 'mute_controlgroup',
	SetInputLevel: 'set_level_input',
	AdjustInputLevel: 'inc_dec_level_input',
	SetZoneLevel: 'set_level_zone',
	AdjustZoneLevel: 'inc_dec_level_zone',
	SetControlGroupLevel: 'set_level_controlgroup',
	AdjustControlGroupLevel: 'inc_dec_level_controlgroup',
	RecallPreset: 'preset_recall',
	PlaybackTrack: 'playback_track',
	MuteInputToZone: 'input_to_zone',
	AdjustInputToZoneSendLevel: 'inc_dec_in_zn_send_level',
	AdjustZoneToZoneSendLevel: 'inc_dec_zn_zn_send_level',
}

/**
 * @typedef {typeof ActionId[keyof typeof ActionId]} ActionId
 */

/**
 * Builds a number input field for Companion Actions.
 * Id of the field will be 'number'.
 * @param {String} label - The label of the field
 * @param {Number} max - maximum value of the number input
 * @returns {Object[]}
 */
function listOptions(label, max) {
	return [
		{
			type: 'number',
			id: 'number',
			label,
			default: 1,
			min: 1,
			max: max,
			asInteger: true, // only allow integer values
			clampValues: false, // would change values when switching AHM types
		},
	]
}

/**
 * Builds Companion Action Options for mute actions.
 * Id of the number field will be 'mute_number'.
 * Id of the operation dropdown will be 'operation'.
 * Id of the mute checkbox field will be 'mute'.
 * @param {String} label - The label of the number field
 * @param {Number} max - maximum value of the number input
 * @returns {Object[]}
 */
function muteOptions(label, max) {
	return [
		{
			type: 'number',
			id: 'mute_number',
			label,
			default: 1,
			min: 1,
			max: max,
			asInteger: true, // only allow integer values
			clampValues: false, // would change values when switching AHM types
		},
		{
			type: 'dropdown',
			id: 'operation',
			label: 'Operation',
			default: MuteOperation.Set,
			choices: [
				{ id: MuteOperation.Set, label: 'Set mute state' },
				{ id: MuteOperation.Toggle, label: 'Toggle current state' },
			],
		},
		{
			type: 'checkbox',
			id: 'mute',
			label: 'Mute',
			isVisible: (options) => options.operation !== MuteOperation.Toggle,
			default: true,
		},
	]
}

/**
 * Builds Companion Action Options for set level actions
 * Id of the number field will be 'setlvl_ch_number'.
 * Id of the level dropdown field will be 'level'.
 * @param {String} label - The label of the number field
 * @param {Number} max - maximum value of the number input
 * @returns {Object[]}
 */
function setLevelOptions(label, max) {
	return [
		{
			type: 'number',
			id: 'setlvl_ch_number',
			label,
			default: 1,
			min: 1,
			max: max,
			asInteger: true, // only allow integer values
			clampValues: false, // would change values when switching AHM types
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

/**
 * Builds Companion Action Options for adjust level actions
 * Id of the number field will be 'incdec_ch_number'.
 * Id of the increment/decrement checkbox will be 'incdec'.
 * @param {String} label - The label of the number field
 * @param {Number} max - maximum value of the number input
 * @returns {Object[]}
 */
function adjustLevelOptions(label, max) {
	return [
		{
			type: 'number',
			id: 'incdec_ch_number',
			label,
			default: 1,
			min: 1,
			max: max,
			asInteger: true, // only allow integer values
			clampValues: false, // would change values when switching AHM types
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

/**
 * Builds Companion Action Options for playback actions
 * @param {String} label - leading text for dropdown options
 * @returns {Object[]}
 */
function playbackChannelOptions(label) {
	return [
		{
			type: 'dropdown',
			id: 'playbackChannel',
			label,
			default: 0,
			choices: getChoicesArrayOfKeyValueObject(PlaybackChannel),
			minChoicesForSearch: 0,
		},
	]
}

async function resolveMute(action, requestCurrentMute, target) {
	if (action.options.operation !== MuteOperation.Toggle) return action.options.mute

	try {
		return !(await requestCurrentMute())
	} catch (error) {
		log.error('ToggleMuteFailed', { target, message: error.message ?? error })
		return undefined
	}
}

function requestCurrentChannelMute(state, tcpClient, type, chNumber) {
	const pendingMute = state.waitForChannelMute(type, chNumber, MUTE_STATE_TIMEOUT_MS)
	tcpClient.queue(requestMuteInfo(type, chNumber))
	return pendingMute
}

function requestCurrentSendMute(state, tcpClient, inputNum, zoneNum) {
	const pendingMute = state.waitForSendMute(ChannelType.Input, inputNum, zoneNum, MUTE_STATE_TIMEOUT_MS)
	tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.MUTE, inputNum, zoneNum))
	return pendingMute
}

export function getActions(numberOfInputs, numberOfZones, numberOfControlGroups) {
	const { companion, state, tcpClient } = getContext()
	let actions = {}

	// MUTE ACTIONS //

	actions[ActionId.MuteInput] = {
		name: 'Mute Input',
		options: muteOptions('Input', numberOfInputs),
		callback: async (action) => {
			const inputNum = action.options.mute_number
			const mute = await resolveMute(
				action,
				() => requestCurrentChannelMute(state, tcpClient, ChannelType.Input, inputNum),
				`input ${inputNum}`,
			)
			if (mute === undefined) return

			log.debug(ActionId.MuteInput, { inputNum, mute, operation: action.options.operation ?? MuteOperation.Set })
			tcpClient.queue(setMute(ChannelType.Input, inputNum, mute))

			state.setChannel(ChannelType.Input, inputNum, undefined, mute)
			companion.checkFeedbacks(FeedbackId.InputMute)
		},
	}

	actions[ActionId.MuteZone] = {
		name: 'Mute Zone',
		options: muteOptions('Zone', numberOfZones),
		callback: async (action) => {
			const zoneNum = action.options.mute_number
			const mute = await resolveMute(
				action,
				() => requestCurrentChannelMute(state, tcpClient, ChannelType.Zone, zoneNum),
				`zone ${zoneNum}`,
			)
			if (mute === undefined) return

			log.debug(ActionId.MuteZone, { zoneNum, mute, operation: action.options.operation ?? MuteOperation.Set })
			tcpClient.queue(setMute(ChannelType.Zone, zoneNum, mute))

			state.setChannel(ChannelType.Zone, zoneNum, undefined, mute)
			companion.checkFeedbacks(FeedbackId.ZoneMute)
		},
	}

	actions[ActionId.MuteControlGroup] = {
		name: 'Mute Control Group',
		options: muteOptions('Control Group', numberOfControlGroups),
		callback: async (action) => {
			const cgNum = action.options.mute_number
			const mute = await resolveMute(
				action,
				() => requestCurrentChannelMute(state, tcpClient, ChannelType.ControlGroup, cgNum),
				`control group ${cgNum}`,
			)
			if (mute === undefined) return

			log.debug(ActionId.MuteControlGroup, {
				cgNum,
				mute,
				operation: action.options.operation ?? MuteOperation.Set,
			})
			tcpClient.queue(setMute(ChannelType.ControlGroup, cgNum, mute))

			state.setChannel(ChannelType.ControlGroup, cgNum, undefined, mute)
			companion.checkFeedbacks(FeedbackId.ControlGroupMute)
		},
	}

	actions[ActionId.MuteInputToZone] = {
		name: 'Mute Input to Zone',
		options: muteOptions('Input', numberOfInputs).concat(listOptions('Zone', numberOfZones)),
		callback: async (action) => {
			const inputNum = action.options.mute_number
			const zoneNum = action.options.number
			const mute = await resolveMute(
				action,
				() => requestCurrentSendMute(state, tcpClient, inputNum, zoneNum),
				`input ${inputNum} to zone ${zoneNum}`,
			)
			if (mute === undefined) return

			log.debug(ActionId.MuteInputToZone, {
				inputNum,
				zoneNum,
				mute,
				operation: action.options.operation ?? MuteOperation.Set,
				infoType: SendInfoType.MUTE,
			})
			tcpClient.queue(setInputToZoneMute(inputNum, zoneNum, mute))

			// manually update internal state
			state.setSend(ChannelType.Input, inputNum, zoneNum, undefined, mute)
			companion.checkFeedbacks(FeedbackId.InputToZoneMute)

			setTimeout(() => {
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.MUTE, inputNum, zoneNum))
			}, 200)
		},
	}

	// LEVEL ACTIONS //

	actions[ActionId.SetInputLevel] = {
		name: 'Set Level of Input',
		options: setLevelOptions('Input', numberOfInputs),
		callback: (action) => {
			const inputNum = action.options.setlvl_ch_number
			const level = parseInt(action.options.level)

			log.debug(ActionId.SetInputLevel, { inputNum, level })
			tcpClient.queue(setLevel(ChannelType.Input, inputNum, level))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.Input, inputNum))
			}, 200)
		},
	}

	actions[ActionId.AdjustInputLevel] = {
		name: 'Increment/Decrement Level of Input',
		options: adjustLevelOptions('Input', numberOfInputs),
		callback: (action) => {
			const inputNum = action.options.incdec_ch_number
			const increment = action.options.incdec == 'inc'

			tcpClient.queue(adjustLevel(ChannelType.Input, inputNum, increment))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.Input, inputNum))
			}, 200)
		},
	}

	actions[ActionId.SetZoneLevel] = {
		name: 'Set Level of Zone',
		options: setLevelOptions('Zone', numberOfZones),
		callback: (action) => {
			const zoneNum = action.options.setlvl_ch_number
			const level = parseInt(action.options.level)

			log.debug(ActionId.SetZoneLevel, { zoneNum, level })
			tcpClient.queue(setLevel(ChannelType.Zone, zoneNum, level))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.Zone, zoneNum))
			}, 200)
		},
	}

	actions[ActionId.AdjustZoneLevel] = {
		name: 'Increment/Decrement Level of Zone',
		options: adjustLevelOptions('Zone', numberOfZones),
		callback: (action) => {
			const zoneNum = action.options.incdec_ch_number
			const increment = action.options.incdec == 'inc'

			tcpClient.queue(adjustLevel(ChannelType.Zone, zoneNum, increment))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.Zone, zoneNum))
			}, 200)
		},
	}

	actions[ActionId.SetControlGroupLevel] = {
		name: 'Set Level of Control Group',
		options: setLevelOptions('Control Group', numberOfControlGroups),
		callback: (action) => {
			const controlGroupNum = action.options.setlvl_ch_number
			const level = parseInt(action.options.level)

			log.debug(ActionId.SetControlGroupLevel, { controlGroupNum, level })
			tcpClient.queue(setLevel(ChannelType.ControlGroup, controlGroupNum, level))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.ControlGroup, controlGroupNum))
			}, 200)
		},
	}

	actions[ActionId.AdjustControlGroupLevel] = {
		name: 'Increment/Decrement Level of Control Group',
		options: adjustLevelOptions('Control Group', numberOfControlGroups),
		callback: (action) => {
			const controlGroupNum = action.options.incdec_ch_number
			const increment = action.options.incdec == 'inc'

			tcpClient.queue(adjustLevel(ChannelType.ControlGroup, controlGroupNum, increment))
			setTimeout(() => {
				tcpClient.queue(requestLevelInfo(ChannelType.ControlGroup, controlGroupNum))
			}, 200)
		},
	}

	actions[ActionId.AdjustInputToZoneSendLevel] = {
		name: 'Increment/Decrement Input to Zone Send Level',
		options: adjustLevelOptions('Input', numberOfInputs).concat(listOptions('Zone', numberOfZones)),
		callback: (action) => {
			const fromChNum = action.options.incdec_ch_number
			const toChNum = action.options.number
			const increment = action.options.incdec == 'inc'

			tcpClient.queue(adjustSendLevel(SendType.InputToZone, fromChNum, toChNum, increment))
			setTimeout(() => {
				tcpClient.queue(requestSendInfo(SendType.InputToZone, SendInfoType.LEVEL, fromChNum, toChNum))
			}, 200)
		},
	}

	actions[ActionId.AdjustZoneToZoneSendLevel] = {
		name: 'Increment/Decrement Zone to Zone Send Level',
		options: adjustLevelOptions('Zone', numberOfZones).concat(listOptions('Zone', numberOfZones)),
		callback: (action) => {
			const fromChNum = action.options.incdec_ch_number
			const toChNum = action.options.number
			const increment = action.options.incdec == 'inc'

			tcpClient.queue(adjustSendLevel(SendType.ZoneToZone, fromChNum, toChNum, increment))
			setTimeout(() => {
				tcpClient.queue(requestSendInfo(SendType.ZoneToZone, SendInfoType.LEVEL, fromChNum, toChNum))
			}, 200)
		},
	}

	// PRESET ACTIONS //

	actions[ActionId.RecallPreset] = {
		name: 'Recall Preset',
		options: listOptions('Preset', PRESET_COUNT),
		callback: (action) => {
			let presetNum = action.options.number

			tcpClient.queue(recallPreset(presetNum))
		},
	}

	// PLAYBACK ACTIONS //

	actions[ActionId.PlaybackTrack] = {
		name: 'Playback Track',
		options: listOptions('Playback Track', PLAYBACK_COUNT).concat(playbackChannelOptions('Playback Channel')),
		callback: (action) => {
			let trackNum = action.options.number
			let playbackChannel = action.options.playbackChannel

			tcpClient.queue(setPlaybackTrack(trackNum, playbackChannel))
		},
	}

	return actions
}
