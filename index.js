import { InstanceBase, Regex, runEntrypoint, InstanceStatus } from '@companion-module/base'
import { getActions } from './src/actions.js'
import { getPresets } from './src/presets.js'
import { getVariables } from './src/variables.js'
import { getFeedbacks } from './src/feedbacks.js'
import UpgradeScripts from './src/upgrades.js'
import { ChannelType, MonitoredFeedbackType  } from './src/utility/constants.js'
import { sleep } from './src/utility/helpers.js'
import { configFields } from './src/config.js'
import { trackAHMParams } from './src/state/AHMState.js'
import { TCPClient } from './src/client/TCP.js'
import { pollStateTimer } from './src/client/pollState.js'

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
		this.numberOfInputs = parseInt(this.config.ahm_type) || 64
		this.numberOfZones = parseInt(this.config.ahm_type) || 64
		this.numberOfControlGroups = 32

		console.log(`This module is set up for an AHM-${this.numberOfInputs}`)

		// Set up state container
		this.AHMState = trackAHMParams()

		// Assign TCP client
		this.tcpClient = TCPClient({
			companion: {
				checkFeedbacks: (...a) => this.checkFeedbacks(...a),
				log: (...a) => this.log(...a),
				updateStatus: (...a) => this.updateStatus(...a),
				setVariableValues: (...a) => this.setVariableValues(...a)
			}
		}, this.AHMState, TIME_BETW_MULTIPLE_REQ_MS)

		// Set up state polling
		this.pollState = pollStateTimer(
			this.tcpClient,
			this.config.pollRate,
			this.AHMState,
			(err) => console.error("Poller error:", err)
		)

		// Init TCP connection
		this.tcpClient.init(this.config.host, MIDI_PORT)
		// Polling callback hooks
		this.tcpClient.onConnected(() => {
			this.pollState.start()
		})
		this.tcpClient.onDisconnect(() => {
			this.pollState.stop()
		})
		this.initActions()
		this.initFeedbacks()
		this.initPresets()
		this.initVariables()
	}

	async destroy() {
		this.tcpClient.destroy()
		this.pollState.stop()
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.config = config

		this.numberOfInputs = parseInt(this.config.ahm_type)
		this.numberOfZones = parseInt(this.config.ahm_type)
		
		// Set up state polling
		this.pollState = pollStateTimer(
			this.tcpClient,
			this.config.pollRate,
			this.AHMState,
			(err) => console.error("Poller error:", err)
		)
		this.pollState.start()
		this.initActions()
		this.initVariables()
		this.tcpClient.init(this.config.host, MIDI_PORT)
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

	/* case 'get_phantom':
				cmd.buffers = [
					Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, 0x00, 0x01, 0x0b, 0x1b, channel, 0xf7]),
				]
				break
			case 'get_muteInfo':
				cmd.buffers = [Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, 0x00, 0x01, 0x09, channel, 0xf7])]
				break */

}

runEntrypoint(AHMInstance, UpgradeScripts)
