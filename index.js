import { InstanceBase, Regex, runEntrypoint, InstanceStatus, TCPHelper } from '@companion-module/base'
import { getActions } from './actions.js'
import { getPresets } from './presets.js'
import { getVariables } from './variables.js'
import { getFeedbacks } from './feedbacks.js'
import UpgradeScripts from './upgrades.js'
import * as Constants from './constants.js'
import * as Helpers from './helpers.js'

const MIDI_PORT = 51325
const TIME_BETW_MULTIPLE_REQ_MS = 150

class AHMInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config

		this.updateStatus(InstanceStatus.Connecting)

		// default to 64 in/outs (AHM-64), create all arrays with maximum 64 channels
		this.numberOfInputs = 64
		this.numberOfZones = 64
		this.numberOfControlGroups = 32
		this.inputsMute = this.createArray(this.numberOfInputs)
		this.inputsToZonesMute = []
		this.zonesMute = this.createArray(this.numberOfZones)
		this.controlgroupsMute = this.createArray(this.numberOfControlGroups)
		// list of monitored feedbacks
		this.monitoredFeedbacks = []

		// then set unit type according to config; reduces traffic if smaller AHM is used
		this.initUnitType()
		this.initTCP()
		this.initActions()
		this.initFeedbacks()
		this.initPresets()
		this.initVariables()
	}

	async destroy() {
		if (this.midiSocket !== undefined) {
			this.midiSocket.destroy()
		}
		this.log('debug', 'destroy')
	}

	initUnitType() {
		switch (this.config.ahm_type) {
			case 'ahm16':
				this.log('info', 'Set Unit Type to AHM-16.')
				this.numberOfInputs = 16
				this.numberOfZones = 16
				break
			case 'ahm32':
				this.log('info', 'Set Unit Type to AHM-32.')
				this.numberOfInputs = 32
				this.numberOfZones = 32
				break
			case 'ahm64':
			default:
				this.log('info', 'Set Unit Type to AHM-64.')
				break
		}
	}

	async configUpdated(config) {
		this.config = config
		this.initUnitType()
		this.initActions()
		this.initVariables()
		this.initTCP()
	}

	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Device IP',
				width: 6,
				default: '',
				regex: Regex.IP,
			},
			{
				type: 'dropdown',
				id: 'ahm_type',
				label: 'Type of Device (Re-enable required after change)',
				width: 6,
				choices: [
					{ id: 'ahm64', label: 'AHM-64' },
					{ id: 'ahm32', label: 'AHM-32' },
					{ id: 'ahm16', label: 'AHM-16' },
				],
				default: 'ahm64',
			},
		]
	}

	initVariables() {
		const [definitions, initValues] = getVariables.bind(this)()
		this.setVariableDefinitions(definitions)
		this.setVariableValues(initValues)
	}

	initFeedbacks() {
		const feedbacks = getFeedbacks.bind(this)()
		this.setFeedbackDefinitions(feedbacks)
	}

	initPresets() {
		const presets = getPresets.bind(this)()
		this.setPresetDefinitions(presets)
	}

	initActions() {
		const actions = getActions.bind(this)()
		this.setActionDefinitions(actions)
	}

	async pollAllMonitoredFeedbacks() {
		for (const feedback of this.monitoredFeedbacks) {
			await this.pollMonitoredFeedback(feedback)
			await this.sleep(TIME_BETW_MULTIPLE_REQ_MS)
		}
	}

	async pollMonitoredFeedback(feedback) {
		switch (feedback.type) {
			case Constants.MonitoredFeedbackType.MuteState:
				this.requestSendMuteInfo(feedback.sendType, feedback.channel, feedback.sendChannel)
				break
			case Constants.MonitoredFeedbackType.Undefined:
				// do nothing
				break
			default:
				console.log(`pollMonitoredFeedback: type of feedback not implemented`)
		}
	}

	sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	async updateLevelVariables() {
		// get inputs
		let unitInAmount = this.numberOfInputs
		for (let index = 1; index <= unitInAmount; index++) {
			this.requestLevelInfo(index) // inputs = 0
			await this.sleep(TIME_BETW_MULTIPLE_REQ_MS)
		}
	}

	async performReadoutAfterConnected() {
		await this.pollAllMonitoredFeedbacks()

		// get input info
		let unitInAmount = this.numberOfInputs
		for (let index = 1; index <= unitInAmount; index++) {
			this.requestMuteInfo(Constants.ChannelType.Input, index)
			await this.sleep(TIME_BETW_MULTIPLE_REQ_MS)
			this.requestLevelInfo(Constants.ChannelType.Input, index)
			await this.sleep(TIME_BETW_MULTIPLE_REQ_MS)
		}
		// get zone info
		let unitZonesAmount = this.numberOfZones
		for (let index = 1; index <= unitZonesAmount; index++) {
			this.requestMuteInfo(Constants.ChannelType.Zone, index)
			await this.sleep(TIME_BETW_MULTIPLE_REQ_MS)
			this.requestLevelInfo(Constants.ChannelType.Zone, index)
			await this.sleep(TIME_BETW_MULTIPLE_REQ_MS)
		}
		// get control group info
		for (let index = 1; index <= this.numberOfControlGroups; index++) {
			this.requestMuteInfo(Constants.ChannelType.ControlGroup, index)
			await this.sleep(TIME_BETW_MULTIPLE_REQ_MS)
			this.requestLevelInfo(Constants.ChannelType.ControlGroup, index)
			await this.sleep(TIME_BETW_MULTIPLE_REQ_MS)
		}
	}

	requestMuteInfo(chType, chNumber) {
		if (Helpers.checkIfValueOfEnum(chType, Constants.ChannelType) == false) {
			return
		}

		let buffer = [
			Buffer.from([
				0xf0,
				0x00,
				0x00,
				0x1a,
				0x50,
				0x12,
				0x01,
				0x00,
				parseInt(chType),
				0x01,
				0x09,
				parseInt(chNumber) - 1,
				0xf7,
			]),
		]
		this.sendCommand(buffer)
	}

	requestSendMuteInfo(sendType, chNumber, sendChNumber) {
		if (Helpers.checkIfValueOfEnum(sendType, Constants.SendType) == false) {
			return
		}

		// get types of send
		let chType = Helpers.getChTypeOfSendType(sendType)
		let sendChType = Helpers.getSendChTypeOfSendType(sendType)

		console.log(
			`requestSendMuteInfo: chType: ${chType}, ch: ${chNumber}, sendChType: ${sendChType}, sendChNumber: ${sendChNumber}`,
		)

		let buffer = [
			Buffer.from([
				0xf0,
				0x00,
				0x00,
				0x1a,
				0x50,
				0x12,
				0x01,
				0x00,
				parseInt(chType),
				0x01,
				0x0f,
				0x03,
				parseInt(chNumber) - 1,
				parseInt(sendChType),
				parseInt(sendChNumber) - 1,
				0xf7,
			]),
		]
		this.sendCommand(buffer)
	}

	requestLevelInfo(chType, chNumber) {
		if (Helpers.checkIfValueOfEnum(chType, Constants.ChannelType) == false) {
			return
		}

		let buffer = [
			Buffer.from([
				0xf0,
				0x00,
				0x00,
				0x1a,
				0x50,
				0x12,
				0x01,
				0x00,
				parseInt(chType),
				0x01,
				0x0b,
				0x17,
				parseInt(chNumber) - 1,
				0xf7,
			]),
		]
		this.sendCommand(buffer)
	}

	createArray(size, extraArrayLength) {
		let array = new Array(size)
		for (let index = 0; index < array.length; index++) {
			if (extraArrayLength) {
				array[index] = []
			} else {
				array[index] = 0
			}
		}
		return array
	}

	/* Make method accessible to functions of other files and log variable changes */
	setVariableValues(values) {
		this.log('debug', `Updating variables: ${JSON.stringify(values)} `)
		super.setVariableValues(values)
	}

	/* Return corresponding dBu Value to decimal number */
	getDbuValue(dezValue) {
		if (Number.isInteger(dezValue) == false || dezValue > 127 || dezValue < 0) {
			return NaN
		}

		return Constants.dbu_Values[dezValue]
	}

	/* case 'get_phantom':
				cmd.buffers = [
					Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, 0x00, 0x01, 0x0b, 0x1b, channel, 0xf7]),
				]
				break
			case 'get_muteInfo':
				cmd.buffers = [Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, 0x00, 0x01, 0x09, channel, 0xf7])]
				break */

	sendCommand(buffers) {
		if (buffers.length != 0) {
			for (let i = 0; i < buffers.length; i++) {
				if (this.midiSocket !== undefined) {
					this.log('debug', `sending ${buffers[i].toString('hex')} via MIDI TCP @${this.config.host}`)
					this.midiSocket.send(buffers[i])
				}
			}
		}
	}

	initTCP() {
		if (this.midiSocket !== undefined) {
			this.midiSocket.destroy()
			delete this.midiSocket
		}

		if (this.config.host) {
			this.midiSocket = new TCPHelper(this.config.host, MIDI_PORT)

			this.midiSocket.on('status_change', (status, message) => {
				this.updateStatus(status)
			})

			this.midiSocket.on('error', (err) => {
				this.log('error', 'Error: ' + err.message)
				this.updateStatus(InstanceStatus.ConnectionFailure)
			})

			this.midiSocket.on('data', (data) => {
				this.processIncomingData(data)
			})

			this.midiSocket.on('connect', () => {
				this.log('debug', `MIDI Connected to ${this.config.host}`)
				this.updateStatus(InstanceStatus.Ok)
				this.performReadoutAfterConnected()
			})
		}
	}

	hexToDec(hexString) {
		return parseInt(hexString)
	}

	processIncomingData(data) {
		console.log(data)

		if (data[0] === 0xF0) {
			// receiving SysEx data
			if (data[9] === 0x03) {
				// receiving send mute data

				/* console.log(
					`Input ${this.hexToDec(data[10]) + 1} to zone Zone ${this.hexToDec(data[12]) + 1} ${
						data[13] == 63 ? 'unmute' : 'mute'
					}`
				)
				this.log(
					'debug',
					`Input ${this.hexToDec(data[10]) + 1} to zone Zone ${this.hexToDec(data[12]) + 1} ${
						data[13] == 63 ? 'unmute' : 'mute'
					}`
				)*/

				let inputNum = this.hexToDec(data[10]) + 1
				let zoneNum = this.hexToDec(data[12]) + 1
				let muteState = data[13] == 63 ? 0 : 1

				this.updateSendMuteState(Constants.SendType.InputToZone, inputNum, zoneNum, muteState)
				this.checkFeedbacks('inputToZoneMute')
				return
			}
			return
		}

		if (data[1] === 0x63 && data[3] === 0x62) {
			// second value of hex:63 and fourth value of hex:62 means level data
			if (data[0] === 0xB0) {
				// first value of hex:b0 means channel level data

				let inputLvlChangeNum = this.hexToDec(data[2]) + 1
				let levelInput = this.hexToDec(data[6])
				let variableNameInput = Helpers.getVarNameInputLevel(inputLvlChangeNum)

				this.log(
					'debug',
					`Input ${inputLvlChangeNum} has new level: ${levelInput} (dec) = ${this.getDbuValue(levelInput)} (dBu), changing variable ${variableNameInput}`,
				)

				this.setVariableValues({ [variableNameInput]: this.getDbuValue(levelInput) })

				return
			}
			if (data[0] === 0xB1) {
				// first value of hex:b1 means zone level data

				let zoneLvlChangeNum = this.hexToDec(data[2]) + 1
				let levelZone = this.hexToDec(data[6])
				let variableNameZone = Helpers.getVarNameZoneLevel(zoneLvlChangeNum)

				this.log(
					'debug',
					`Zone ${zoneLvlChangeNum} has new level: ${levelZone} (dec) = ${this.getDbuValue(levelZone)} (dBu), changing variable ${variableNameZone}`,
				)

				this.setVariableValues({ [variableNameZone]: this.getDbuValue(levelZone) })

				return
			}
			if (data[0] === 0xB2) {
				// first value of hex:b2 means control group level data

				let cgLvlChangeNum = this.hexToDec(data[2]) + 1
				let levelCG = this.hexToDec(data[6])
				let variableNameCG = Helpers.getVarNameCGLevel(cgLvlChangeNum)

				this.log(
					'debug',
					`Control Group ${cgLvlChangeNum} has new level: ${levelCG} (dec) = ${this.getDbuValue(levelCG)} (dBu), changing variable ${variableNameCG}`,
				)

				this.setVariableValues({ [variableNameCG]: this.getDbuValue(levelCG) })

				return
			}
		}

		if (data[0] === 0x90 || data[0] === 0x91 || data[0] === 0x92) {
			// first value of hex:90, hex:91, or hex:92 means mute of some kind
			if (data[0] === 0x90) {
				// first value of hex:90 means channel mute

				// data[2] 63 == unmute, 127 == mute
				//console.log(`Channel ${data[2] == 63 ? 'unmute' : 'mute'}: ${this.hexToDec(data[1]) + 1}`)
				// this.log('debug', `Channel ${parseInt(data[1], 16) + 1} ${data[2] == 63 ? 'unmute' : 'mute'}`)
				this.inputsMute[this.hexToDec(data[1])] = data[2] == 63 ? 0 : 1
				this.checkFeedbacks('inputMute')
				return
			}
			if (data[0] === 0x91) {
				// first value of hex:91 means zone mute

				//console.log(`Zone ${data[2] == 63 ? 'unmute' : 'mute'}: ${this.hexToDec(data[1]) + 1}`)
				//this.log('debug', `Zone ${this.hexToDec(data[1]) + 1} ${data[2] == 63 ? 'unmute' : 'mute'}`)
				this.zonesMute[this.hexToDec(data[1])] = data[2] == 63 ? 0 : 1
				this.checkFeedbacks('zoneMute')
				return
			}
			if (data[0] === 0x92) {
				// first value of hex:92 means channel group mute

				this.log('debug', `Control Group ${this.hexToDec(data[1]) + 1} ${data[2] == 63 ? 'unmute' : 'mute'}`)
				this.controlgroupsMute[this.hexToDec(data[1])] = data[2] == 63 ? 0 : 1
				this.checkFeedbacks('cgMute')
				return
			}
		}

		if (data[0] === 0xB0 && data[3] === 0xC0) {
			// first value of hex:B0 and third value of hex:C0 means preset recall data
			return
		}
	}

	/**
	 * Updates the internally stored Mute State of a Send.
	 * @param channelNumber Number of Channel (Source of Send), User-Number, not zero-based identifier.
	 * @param sendChannelNumber Number of Send Channel (Destination of Send), User-Number, not zero-based identifier.
	 * @param muteState 0 = unmuted, 1 = muted
	 */
	updateSendMuteState(sendType, channelNumber, sendChannelNumber, muteState) {
		if (Helpers.checkIfValueOfEnum(sendType, Constants.SendType) == false) {
			return
		}

		switch (sendType) {
			case Constants.SendType.InputToZone:
				// check if the array inputsToZonesMute does not yet have a SubArray for this input
				if (Array.isArray(this.inputsToZonesMute[channelNumber]) == false) {
					// if there is no array, create the entry
					this.inputsToZonesMute[channelNumber] = new Array(this.numberOfZones + 1).fill(0)
					console.log(
						`updateSendMuteState: Created Array with amount=${this.numberOfZones + 1} for inputNumber=${channelNumber} in this.inputsToZonesMute`,
					)
				}
				// check if SubArray has incorrect format => If yes write nothing to variable and report error via log
				if (typeof this.inputsToZonesMute[channelNumber][sendChannelNumber] === 'undefined') {
					console.log(
						`updateSendMuteState: Cannot access Mute Input ${channelNumber} to Zone ${sendChannelNumber} State.`,
					)
				} else {
					// happy path: update mute state
					this.inputsToZonesMute[channelNumber][sendChannelNumber] = muteState
				}

				break
			default:
				console.log(`updateSendMuteState: Storing Mute States is not implemented for Send Type ${sendType}`)
		}
	}
}

runEntrypoint(AHMInstance, UpgradeScripts)
