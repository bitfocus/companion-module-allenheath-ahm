import { InstanceBase, Regex, runEntrypoint, InstanceStatus, TCPHelper } from '@companion-module/base'
import { getActions } from './actions.js'
import { getPresets } from './presets.js'
import { getVariables } from './variables.js'
import { getFeedbacks } from './feedbacks.js'
import { requestLevelInfo, requestMuteInfo, requestSendMuteInfo } from './src/utility/formatRequest.js'
import UpgradeScripts from './upgrades.js'
import * as Constants from './src/utility/constants.js'
import * as Helpers from './src/utility/helpers.js'
import { configFields } from './src/config.js'
import { trackAHMParams } from './src/state/AHMState.js'
import { TCPClient } from './src/client/TCP.js'

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
		// most recently recalled preset
		this.currentPreset = 0

		// Set up used feedbacks tracker
		this.AHMState = trackAHMParams()

		// Assign TCP client
		this.tcpClient = TCPClient({
			companion: {
				checkFeedbacks: (...a) => this.checkFeedbacks(...a),
				log: (...a) => this.log(...a),
				updateStatus: (...a) => this.updateStatus(...a),
				setVariableValues: (...a) => this.setVariableValues(...a)
			}
		}, this.AHMState)

		// then set unit type according to config; reduces traffic if smaller AHM is used
		this.initUnitType()
		this.tcpClient.initTCP(this.config.host, MIDI_PORT)
		this.initActions()
		this.initFeedbacks()
		this.initPresets()
		this.initVariables()
	}

	async destroy() {
		this.tcpClient.destroyTCP()
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
		return configFields
	}

	initVariables() {
		const [definitions, initValues] = getVariables(this.numberOfInputs, this.numberOfZones)
		this.setVariableDefinitions(definitions)
		this.setVariableValues(initValues)
	}

	initFeedbacks() {
		this.setFeedbackDefinitions(getFeedbacks(this.AHMState))
	}

	initPresets() {
		this.setPresetDefinitions(getPresets(this.numberOfInputs, this.numberOfZones))
	}

	initActions() {
		this.setActionDefinitions(getActions(this.tcpClient, this.AHMState, this.numberOfInputs, this.numberOfZones, {
			companion: {
				checkFeedbacks: (...a) => this.checkFeedbacks(...a),
			}
		}))
	}

	async pollAllMonitoredFeedbacks() {
		for (const feedback of this.monitoredFeedbacks) {
			await this.pollMonitoredFeedback(feedback)
			await Helpers.sleep(TIME_BETW_MULTIPLE_REQ_MS)
		}
	}

	async pollMonitoredFeedback(feedback) {
		switch (feedback.type) {
			case Constants.MonitoredFeedbackType.MuteState:
				let buffer = requestSendMuteInfo(feedback.sendType, feedback.channel, feedback.sendChannel)
				this.sendCommand(buffer)
				break
			case Constants.MonitoredFeedbackType.Undefined:
				// do nothing
				break
			default:
				console.log(`pollMonitoredFeedback: type of feedback not implemented`)
		}
	}

	async updateLevelVariables() {
		// get inputs
		let unitInAmount = this.numberOfInputs
		for (let index = 1; index <= unitInAmount; index++) {
			let buffer = requestLevelInfo(index) // inputs = 0
			this.sendCommand(buffer)
			await Helpers.sleep(TIME_BETW_MULTIPLE_REQ_MS)
		}
	}

	async performReadoutAfterConnected() {
		await this.pollAllMonitoredFeedbacks()
		let buffer = ""

		// get input info
		let unitInAmount = this.numberOfInputs
		for (let index = 1; index <= unitInAmount; index++) {
			buffer = requestMuteInfo(Constants.ChannelType.Input, index)
			this.sendCommand(buffer)
			await Helpers.sleep(TIME_BETW_MULTIPLE_REQ_MS)
			buffer = requestLevelInfo(Constants.ChannelType.Input, index)
			this.sendCommand(buffer)
			await Helpers.sleep(TIME_BETW_MULTIPLE_REQ_MS)
		}
		// get zone info
		let unitZonesAmount = this.numberOfZones
		for (let index = 1; index <= unitZonesAmount; index++) {
			buffer = requestMuteInfo(Constants.ChannelType.Zone, index)
			this.sendCommand(buffer)
			await Helpers.sleep(TIME_BETW_MULTIPLE_REQ_MS)
			buffer = requestLevelInfo(Constants.ChannelType.Zone, index)
			this.sendCommand(buffer)
			await Helpers.sleep(TIME_BETW_MULTIPLE_REQ_MS)
		}
		// get control group info
		for (let index = 1; index <= this.numberOfControlGroups; index++) {
			buffer = requestMuteInfo(Constants.ChannelType.ControlGroup, index)
			this.sendCommand(buffer)
			await Helpers.sleep(TIME_BETW_MULTIPLE_REQ_MS)
			let buffer = requestLevelInfo(Constants.ChannelType.ControlGroup, index)
			this.sendCommand(buffer)
			await Helpers.sleep(TIME_BETW_MULTIPLE_REQ_MS)
		}
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
