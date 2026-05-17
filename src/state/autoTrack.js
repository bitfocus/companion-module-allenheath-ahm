import { ChannelType } from '../utility/constants.js'

export function createAutoTracking(state) {
	/**
	 * Adds channel to tracked parameters
	 * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
	 * @param {Number} id - channel number
	 */
	function addChannel(type, id) {
		if (!state.trackedChannels[type].has(id)) {
			state.trackedChannels[type].set(id, {
				level: '-inf',
				mute: false,
				sends: new Map(),
			})
		}

		return state.trackedChannels[type].get(id)
	}

	/**
	 * Removes channel from tracked parameters
	 * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
	 * @param {Number} id - channel number
	 */
	function removeChannel(type, id) {
		if (state.manuallyTrackedChannels[type].includes(id)) return

		state.trackedChannels[type]?.delete(id)
		console.log(`Deleting from map ${type} id: ${id}`)
	}

	/**
	 * Stores channel information in tracked channels
	 * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
	 * @param {Number} id - channel number
	 * @param {String} level - level of channel in dBu
	 * @param {Boolean} mute - incoming mute status of channel
	 */
	function setChannel(type, id, level, mute) {
		let channel = state.trackedChannels[type]?.get(id)
		if (!state.trackedChannels[type].has(id)) {
			return
		}

		if (level !== undefined) channel.level = level
		if (mute !== undefined) channel.mute = mute
		console.log('SET INSTANCE', state.trackedChannels)
		console.log('SET STACK')
		console.log('MUTATE', type, id, mute, 'prev=', state.trackedChannels[type].get(id))
	}

	/**
	 * Get map of tracked channels
	 * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
	 * @returns {Map} Map of tracked channels by type
	 */
	function getTrackedChannelMap(type) {
		return state.trackedChannels[type]
	}

	/**
	 * Adds an input or zone send to be tracked
	 * @param {ChannelType} type - ChannelType (Input or Zone)
	 * @param {Number} idFrom
	 * @param {Number} idTo
	 */
	function addSend(type, idFrom, idTo) {
		const channel = addChannel(type, idFrom)

		if (!channel.sends?.has(idTo)) {
			channel.sends.set(idTo, {
				level: '-inf',
				mute: false,
			})
		}

		return channel.sends.get(idTo)
	}

	/**
	 * Removed an input or zone send from tracking
	 * @param {ChannelType} typeFrom - ChannelType (Input or Zone)
	 * @param {Number} idFrom
	 * @param {Number} idTo
	 */
	function removeSend(type, idFrom, idTo) {
		const channel = state.trackedChannels[type]?.get(idFrom)
		if (!channel) return

		channel.sends.delete(idTo)
	}

	/**
	 * Updates send information in tracked channels
	 * @param {ChannelType} type - ChannelType (Input or Zone)
	 * @param {Number} idFrom
	 * @param {Number} idTo
	 * @param {String} level
	 * @param {Boolean} mute
	 */
	function setSend(type, idFrom, idTo, level, mute) {
		const send = addSend(type, idFrom, idTo)

		if (level !== undefined) send.level = level
		if (mute !== undefined) send.mute = mute
	}

	/**
	 * Get list of tracked sends for a specific channel type
	 * @param {ChannelType} type - ChannelType (Input or Zone)
	 * @returns {Number[]} Array of tracked sends for specified channel
	 */
	function getAllSendStates(type) {
		const results = []
		const channels = state.trackedChannels[type]
		if (!(channels instanceof Map)) {
			return results
		}

		console.log('state.trackedChannels[type]', state.trackedChannels[type])
		console.log('isMap', state.trackedChannels[type] instanceof Map)

		for (const [idFrom, channel] of channels) {
			if (!(channel.sends instanceof Map)) continue

			for (const [idTo, send] of channel.sends) {
				results.push({
					idFrom,
					idTo,
					send,
				})
			}
		}

		return results
	}

	/**
	 * Get level of channel from tracked channels
	 * @param {ChannelType} type - ChannelType (Input or Zone)
	 * @param {Number} id - channel number
	 * @returns {Number} Level of channel as integer from API guide
	 */
	function getLevel(type, id) {
		return state.trackedChannels[type]?.get(id)?.level ?? '-inf'
	}

	/**
	 * Get mute status of channel from tracked channels
	 * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
	 * @param {Number} id - channel number
	 * @returns {Boolean} Mute status of channel
	 */
	function getMute(type, id) {
		return state.trackedChannels[type]?.get(id)?.mute ?? false
	}

	/**
	 * Get level of channel send from tracked channels
	 * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
	 * @param {Number} id - channel number
	 * @returns {Number} Level of channel as integer from API guide
	 */
	function getSendLevel(type, idFrom, idTo) {
		return state.trackedChannels[type]?.get(idFrom)?.sends?.get(idTo)?.level ?? '-inf'
	}

	/**
	 * Get mute status of channel send from tracked channels
	 * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
	 * @param {Number} id - channel number
	 * @returns {Boolean} Mute status of channel
	 */
	function getSendMute(type, idFrom, idTo) {
		return state.trackedChannels[type]?.get(idFrom)?.sends?.get(idTo)?.mute ?? false
	}

	/**
	 * Updates the state of the last preset number recalled
	 * @param {Number} id
	 */
	function setPreset(id) {
		state.lastPreset = id
	}

	/**
	 * Gets the last recalled preset
	 * @returns {Number} The last preset recalled
	 */
	function getPreset() {
		return state.lastPreset
	}

	return {
		addChannel,
		removeChannel,
		setChannel,
		addSend,
		removeSend,
		setSend,
		getTrackedChannelMap,
		getAllSendStates,
		getLevel,
		getMute,
		getSendLevel,
		getSendMute,
		setPreset,
		getPreset,
	}
}
