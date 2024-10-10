import { InstanceBase, Regex, runEntrypoint, InstanceStatus, TCPHelper } from '@companion-module/base'
import { getActions } from './actions.js'
import { getPresets } from './presets.js'
import { getVariables } from './variables.js'
import { getFeedbacks } from './feedbacks.js'
import UpgradeScripts from './upgrades.js'
import * as Constants from './constants.js'
import * as Helpers from './helpers.js'

const MIDI_PORT = 51325

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
		this.inputsMute = this.createArray(this.numberOfInputs)
		this.inputsToZonesMute = {}
		this.zonesMute = this.createArray(this.numberOfZones)

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
		this.initUnitChannelSize()
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

	sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	async updateLevelVariables() {
		// get inputs
		let unitInAmount = this.numberOfInputs
		for (let index = 0; index < unitInAmount; index++) {
			this.requestLevelInfo(index) // inputs = 0
			await this.sleep(150)
		}
	}

	async performReadoutAfterConnected() {
		// get input info
		let unitInAmount = this.numberOfInputs
		for (let index = 0; index < unitInAmount; index++) {
			this.requestMuteInfo(Constants.ChannelType.Input, index)
			await this.sleep(150)
			this.requestLevelInfo(Constants.ChannelType.Input, index)
			await this.sleep(150)
		}
		// get zone info
		let unitZonesAmount = this.numberOfZones
		for (let index = 0; index < unitZonesAmount; index++) {
			this.requestMuteInfo(Constants.ChannelType.Zone, index)
			await this.sleep(150)
			this.requestLevelInfo(Constants.ChannelType.Zone, index)
			await this.sleep(150)
		}
	}

	requestMuteInfo(chType, chNumber) {
		if (chType != Constants.ChannelType.Input && chType != Constants.ChannelType.Zone) {
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
				parseInt(chNumber),
				0xf7,
			]),
		]
		this.sendCommand(buffer)
	}

	requestLevelInfo(chType, chNumber) {
		if (chType != Constants.ChannelType.Input && chType != Constants.ChannelType.Zone) {
			return
		}

		let buffer = [
			Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, parseInt(chType), 0x01, 0x0b, 0x17, chNumber, 0xf7]),
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
				this.log('error', 'MIDI error: ' + err.message)
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

		switch (data[0]) {
			case 144:
				// input mute
				// data[2] 63 == unmute, 127 == mute
				//console.log(`Channel ${data[2] == 63 ? 'unmute' : 'mute'}: ${this.hexToDec(data[1]) + 1}`)
				// this.log('debug', `Channel ${parseInt(data[1], 16) + 1} ${data[2] == 63 ? 'unmute' : 'mute'}`)
				this.inputsMute[this.hexToDec(data[1])] = data[2] == 63 ? 0 : 1
				this.checkFeedbacks('inputMute')
				break
			case 145:
				// zone mute
				//console.log(`Zone ${data[2] == 63 ? 'unmute' : 'mute'}: ${this.hexToDec(data[1]) + 1}`)
				//this.log('debug', `Zone ${this.hexToDec(data[1]) + 1} ${data[2] == 63 ? 'unmute' : 'mute'}`)
				this.zonesMute[this.hexToDec(data[1])] = data[2] == 63 ? 0 : 1
				this.checkFeedbacks('zoneMute')
				break
			case 240:
				// input to zone mute
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

				if (this.inputsToZonesMute[inputNum]?.[zoneNum]) {
					this.inputsToZonesMute[inputNum][zoneNum] = data[13] == 63 ? 0 : 1
				} else {
					this.inputsToZonesMute[inputNum] = {}
					this.inputsToZonesMute[inputNum][zoneNum] = data[13] == 63 ? 0 : 1
				}
				this.checkFeedbacks('inputToZoneMute')
				break
			case 176:
				// level change on input
				let inputLvlChangeNum = this.hexToDec(data[2]) + 1
				let levelInput = this.hexToDec(data[6])
				let variableNameInput = Helpers.getVarNameInputLevel(inputLvlChangeNum)

				this.log(
					'debug',
					`Input ${inputLvlChangeNum} has new level: ${levelInput} (dec) = ${this.getDbuValue(levelInput)} (dBu), changing variable ${variableNameInput}`,
				)

				this.setVariableValues({ [variableNameInput]: this.getDbuValue(levelInput) })

				break
			case 177:
				// level change on zone
				let zoneLvlChangeNum = this.hexToDec(data[2]) + 1
				let levelZone = this.hexToDec(data[6])
				let variableNameZone = Helpers.getVarNameZoneLevel(zoneLvlChangeNum)

				this.log(
					'debug',
					`Zone ${zoneLvlChangeNum} has new level: ${levelZone} (dec) = ${this.getDbuValue(levelZone)} (dBu), changing variable ${variableNameZone}`,
				)

				this.setVariableValues({ [variableNameZone]: this.getDbuValue(levelZone) })

				break
			default:
				//console.log('Extra data coming in')
				break
		}
	}
}

runEntrypoint(AHMInstance, UpgradeScripts)
