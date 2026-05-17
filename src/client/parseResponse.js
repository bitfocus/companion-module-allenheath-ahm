import { ChannelType } from '../utility/constants.js'
import { getVarNameInputLevel, getVarNameZoneLevel, getVarNameCGLevel, getDbuValue } from '../utility/helpers.js'

export function parseResponse(data, { companion }, state) {
	console.log(data)

	if (data[0] === 0xf0) {
		// receiving SysEx data

		// Common data for all channel types:
		let inputNum = parseInt(data[10]) + 1
		let zoneNum = parseInt(data[12]) + 1

		if (data[9] === 0x02) {
			// receiving send level data
			let level = parseInt(data[13])

			state.setSend(ChannelType.Input, inputNum, zoneNum, level, undefined) // log below displays correct data, this line doesn't
			companion.log(
				'info',
				`RECIEVED: send level data -- Input ${inputNum} to Zone ${zoneNum} at ${getDbuValue(level)}`,
			)
			companion.checkFeedbacks('inputToZoneLevel')
			return
		}

		if (data[9] === 0x03) {
			// receiving send mute data
			let mute

			switch (data[13]) {
				case 127:
					mute = true
					break
				case 63:
					mute = false
					break
				default:
					break
			}

			state.setSend(ChannelType.Input, inputNum, zoneNum, undefined, mute)
			companion.log(
				'info',
				`RECIEVED: send mute data -- Input ${inputNum} to Zone ${zoneNum} is ${mute ? 'muted' : 'unmuted'}`,
			)
			companion.checkFeedbacks('inputToZoneMute')
			return
		}
		return
	}

	if (data[1] === 0x63 && data[3] === 0x62) {
		// second value of hex:63 and fourth value of hex:62 means level data

		// Data shared across all channel types:
		let channel = parseInt(data[2]) + 1
		let level = parseInt(data[6])

		if (data[0] === 0xb0) {
			// first value of hex:b0 means channel level data
			let variableNameInput = getVarNameInputLevel(channel)

			companion.log(
				'info',
				`Input ${channel} has new level: ${level} (dec) = ${getDbuValue(level)} (dBu), changing variable ${variableNameInput}`,
			)

			// Put value in state store if it's being tracked
			state.setChannel(ChannelType.Input, channel, level, undefined)

			companion.setVariableValues({ [variableNameInput]: getDbuValue(level) })
			companion.checkFeedbacks('inputLevel')
			return
		}
		if (data[0] === 0xb1) {
			// first value of hex:b1 means zone level data
			let variableNameZone = getVarNameZoneLevel(channel)

			companion.log(
				'info',
				`Zone ${channel} has new level: ${level} (dec) = ${getDbuValue(level)} (dBu), changing variable ${variableNameZone}`,
			)

			// Put value in state store if it's being tracked
			state.setChannel(ChannelType.Zone, channel, level, undefined)

			companion.setVariableValues({ [variableNameZone]: getDbuValue(level) })
			companion.checkFeedbacks('zoneLevel')
			return
		}
		if (data[0] === 0xb2) {
			// first value of hex:b2 means control group level data
			let variableNameCG = getVarNameCGLevel(channel)

			companion.log(
				'info',
				`Control Group ${channel} has new level: ${level} (dec) = ${getDbuValue(level)} (dBu), changing variable ${variableNameCG}`,
			)

			// Put value in state store if it's being tracked
			state.setChannel(ChannelType.ControlGroup, channel, level, undefined)

			companion.setVariableValues({ [variableNameCG]: getDbuValue(level) })
			companion.checkFeedbacks('cgLevel')
			return
		}
	}

	if (data[0] === 0x90 || data[0] === 0x91 || data[0] === 0x92) {
		// first value of hex:90, hex:91, or hex:92 means mute of some kind
		let mute
		let channel = parseInt(data[1]) + 1
		console.log('INCOMING MUTE DATA:', data[0], channel)

		switch (data[2]) {
			case 127:
				mute = true
				break
			case 63:
				mute = false
				break
			default:
				break
		}

		if (data[0] === 0x90) {
			// first value of hex:90 means channel mute
			state.setChannel(ChannelType.Input, channel, undefined, mute)

			companion.checkFeedbacks('inputMute')
			console.log('FINAL STATE', state.getMute(ChannelType.Input, channel), channel)
			return
		}
		if (data[0] === 0x91) {
			// first value of hex:91 means zone mute
			state.setChannel(ChannelType.Zone, channel, undefined, mute)

			companion.checkFeedbacks('zoneMute')
			return
		}
		if (data[0] === 0x92) {
			// first value of hex:92 means channel group mute
			state.setChannel(ChannelType.ControlGroup, channel, undefined, mute)

			companion.checkFeedbacks('cgMute')
			return
		}
	}

	if (data[0] === 0xb0 && data[3] === 0xc0) {
		// first value of hex:B0 and third value of hex:C0 means preset recall data

		let presetNum = Number(data[4])
		let presetNumOffset = Number(data[2])
		let preset = presetNum + presetNumOffset * 128 + 1
		state.setPreset(preset)

		companion.log('info', `Preset ${state.getPreset()} recalled`)
		companion.setVariableValues({ currentPreset: state.getPreset() })
		companion.checkFeedbacks('currentPreset')
		return
	}
}
