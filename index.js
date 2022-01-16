/**
 *
 * Companion instance class for the A&H dLive & iLive Mixers.
 * @version 1.3.4
 *
 */

let tcp = require('../../tcp')
let instance_skel = require('../../instance_skel')
let actions = require('./actions')
const MIDI_PORT = 51325
const TCPTLS = 51321

/**
 * @extends instance_skel
 * @since 1.2.0
 * @author Andrew Broughton <andy@checkcheckonetwo.com>
 */

class instance extends instance_skel {
	/**
	 * Create an instance.
	 *
	 * @param {EventEmitter} system - the brains of the operation
	 * @param {string} id - the instance ID
	 * @param {Object} config - saved user configuration parameters
	 * @since 1.2.0
	 */
	constructor(system, id, config) {
		super(system, id, config)

		Object.assign(this, {
			...actions,
		})
	}

	/**
	 * Setup the actions.
	 *
	 * @param {EventEmitter} system - the brains of the operation
	 * @access public
	 * @since 1.2.0
	 */
	actions(system) {
		this.setActions(this.getActions())
	}

	/**
	 * Executes the provided action.
	 *
	 * @param {Object} action - the action to be executed
	 * @access public
	 * @since 1.2.0
	 */
	action(action) {
		let opt = action.options
		let channel = parseInt(opt.inputChannel)
		let sceneNumber = parseInt(opt.sceneNumber)
		let cmd = { buffers: [] }

		switch (
			action.action
		) {
			case 'scene_recall':
				cmd.buffers = [Buffer.from([0xB0, 0, sceneNumber < 128 ? 0x00: sceneNumber < 256 ? 0x01 : sceneNumber < 384 ? 0x02 : 0x03, 0xc0, sceneNumber])]
				break
			case 'mute_input':
				cmd.buffers = [Buffer.from([0x90, channel, opt.mute ? 0x7f : 0x3f, 0x90, channel, 0])]
				break
			case 'mute_zone':
				cmd.buffers = [Buffer.from([0x91, channel, opt.mute ? 0x7f : 0x3f, 0x91, channel, 0])]
				break
		}

		if (cmd.buffers.length == 0) {
			// Mute or Fader Level actions
			if (action.action.slice(0, 4) == 'mute') {
				
			} else {
				let faderLevel = parseInt(opt.level)
				cmd.buffers = [Buffer.from([0xb0 + inputZone, 0x63, channel, 0xb0 + inputZone, 0x62, 0x17, 0xb0 + inputZone, 0x06, faderLevel])]
			}
		}

		// console.log(cmd);

		for (let i = 0; i < cmd.buffers.length; i++) {
			if (this.midiSocket !== undefined) {
				this.log('debug', `sending ${cmd.buffers[i].toString('hex')} via MIDI TCP @${this.config.host}`)
				this.midiSocket.write(cmd.buffers[i])
			} 
		}
	}

	/**
	 * Creates the configuration fields for web config.
	 *
	 * @returns {Array} the config fields
	 * @access public
	 * @since 1.2.0
	 */
	config_fields() {
		return [
			{
				type: 'text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module is for the Allen & Heath AHM mixers',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 6,
				default: '192.168.1.70',
				regex: this.REGEX_IP,
			},
		]
	}

	/**
	 * Clean up the instance before it is destroyed.
	 *
	 * @access public
	 * @since 1.2.0
	 */
	destroy() {
		if (this.midiSocket !== undefined) {
			this.midiSocket.destroy()
		}

		this.log('debug', `destroyed ${this.id}`)
	}

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 *
	 * @access public
	 * @since 1.2.0
	 */
	init() {
		this.updateConfig(this.config)
	}

	/**
	 * INTERNAL: use setup data to initalize the tcp tcpSocket object.
	 *
	 * @access protected
	 * @since 1.2.0
	 */
	init_tcp() {

		if (this.midiSocket !== undefined) {
			this.midiSocket.destroy()
			delete this.midiSocket
		}

		if (this.config.host) {
			this.midiSocket = new tcp(this.config.host, MIDI_PORT)

			this.midiSocket.on('status_change', (status, message) => {
				this.status(status, message)
			})

			this.midiSocket.on('error', (err) => {
				this.log('error', 'MIDI error: ' + err.message)
			})

			this.midiSocket.on('connect', () => {
				this.log('debug', `MIDI Connected to ${this.config.host}`)
			})
		}
	}

	/**
	 * Process an updated configuration array.
	 *
	 * @param {Object} config - the new configuration
	 * @access public
	 * @since 1.2.0
	 */
	updateConfig(config) {
		this.config = config

		this.actions()
		this.init_tcp()
	}
}

exports = module.exports = instance
