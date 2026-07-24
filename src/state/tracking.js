import { getChannelTypeName, parseIDsToArray } from '../utility/helpers.js'
import { createLogger } from '../utility/log.js'

const MANUAL_ID = 'MANUAL'
const log = createLogger('Tracking')

/**
 * Manages the values and subscriptions of all tracked channels and sends.
 *
 * A channel is stored in state.trackedChannels[type] and has this shape:
 * { level, mute, subscriptions: Map<feedbackId, feedbackType>, sends: Map }
 *
 * Sends use the same subscription model and are stored below their source
 * channel. Manual tracking is represented as a regular subscription whose ID
 * and type are both "MANUAL". This keeps all reasons for tracking a resource
 * visible alongside its current values.
 */
export function createTracking(state) {
	/**
	 * Create an empty channel state without adding a subscription.
	 * @returns {Object} Newly initialized channel state
	 */
	function createChannel() {
		return { level: 0, mute: false, subscriptions: new Map(), sends: new Map() }
	}

	/**
	 * Get an existing channel or create it when it is not tracked yet.
	 * @param {ChannelType} type - ChannelType
	 * @param {Number} chNumber - Channel number (1-indexed)
	 * @returns {{isNew: Boolean, channel: Object}} Channel state and whether it was newly created
	 */
	function getOrCreateChannel(type, chNumber) {
		let channel = state.trackedChannels[type].get(chNumber)
		const isNew = !channel
		if (!channel) {
			channel = createChannel()
			state.trackedChannels[type].set(chNumber, channel)
		}
		return { isNew, channel }
	}

	/**
	 * Track a channel for a feedback (or for MANUAL tracking).
	 * Repeated callbacks are safe because subscriptions are keyed by feedbackId.
	 * @param {ChannelType} type - ChannelType
	 * @param {Number} chNumber - Channel number (1-indexed)
	 * @param {String} feedbackId - Unique Companion feedback ID or MANUAL
	 * @param {String} feedbackType - Feedback definition ID or MANUAL
	 * @returns {{isNew: Boolean, channel: Object}} Channel state and whether it was newly created
	 */
	function addChannel(type, chNumber, feedbackId, feedbackType) {
		removeStaleChannelSubscriptions(type, chNumber, feedbackId)

		const result = getOrCreateChannel(type, chNumber)
		if (feedbackId !== undefined) result.channel.subscriptions.set(feedbackId, feedbackType)
		return result
	}

	/**
	 * Remove an unused channel while preserving channels with sends.
	 * @param {Map<Number, Object>} channels - Channel map keyed by 1-indexed channel number
	 * @param {Number} chNumber - Channel number (1-indexed)
	 * @param {Object} channel - Channel state to check
	 */
	function pruneChannel(channels, chNumber, channel) {
		if (channel.subscriptions.size === 0 && channel.sends.size === 0) channels.delete(chNumber)
	}

	/**
	 * Remove one feedback subscription. The channel itself is only removed when
	 * no other feedback, manual subscription, or send still needs it.
	 * @param {String} feedbackId - Unique Companion feedback ID or MANUAL
	 * @returns {void}
	 */
	function removeChannel(feedbackId) {
		// iterate through all channels to find feedbackId
		for (const channels of Object.values(state.trackedChannels)) {
			for (const [chNumber, channel] of channels) {
				// feedbackId not found in this send, continue searching
				if (!channel.subscriptions.delete(feedbackId)) continue
				pruneChannel(channels, chNumber, channel)
				return
			}
		}
	}

	/**
	 * Remove a feedback's previous channel subscription when it moved to another channel.
	 * MANUAL tracking is intentionally ignored because multiple manual subscriptions can exist.
	 * @param {ChannelType} type - ChannelType
	 * @param {Number} chNumber - Current channel number (1-indexed)
	 * @param {String} feedbackId - Unique Companion feedback ID or MANUAL
	 * @returns {void}
	 */
	function removeStaleChannelSubscriptions(type, chNumber, feedbackId) {
		if (feedbackId === undefined || feedbackId === MANUAL_ID) return

		const channels = state.trackedChannels[type]
		// loop through all channels
		for (const [existingChNumber, channel] of channels) {
			// This entry is not stale => skip
			if (existingChNumber === chNumber) continue
			// Delete feedback from the old channel, if it exists there
			if (!channel.subscriptions.delete(feedbackId)) continue
			// Run prune on old channel
			pruneChannel(channels, existingChNumber, channel)
			return
		}
	}

	/**
	 * Update values only for channels that are currently being tracked.
	 * @param {ChannelType} type - ChannelType
	 * @param {Number} chNumber - Channel number (1-indexed)
	 * @param {Number|undefined} level - Raw decimal level value
	 * @param {Boolean|undefined} mute - Mute state
	 */
	function setChannel(type, chNumber, level, mute) {
		const channel = state.trackedChannels[type]?.get(chNumber)
		if (!channel) return
		if (level !== undefined) channel.level = level
		if (mute !== undefined) channel.mute = mute
	}

	/**
	 * Get all tracked channels of one type.
	 * @param {ChannelType} type - ChannelType
	 * @returns {Map<Number, Object>} Channel map keyed by 1-indexed channel number
	 */
	function getTrackedChannelMap(type) {
		return state.trackedChannels[type]
	}

	/**
	 * Get a channel's raw decimal level value.
	 * @param {ChannelType} type - ChannelType
	 * @param {Number} chNumber - Channel number (1-indexed)
	 * @returns {Number} Raw decimal level value, or 0 when the channel is not tracked
	 */
	function getLevel(type, chNumber) {
		return state.trackedChannels[type]?.get(chNumber)?.level ?? 0
	}

	/**
	 * Get a channel's mute state.
	 * @param {ChannelType} type - ChannelType
	 * @param {Number} chNumber - Channel number (1-indexed)
	 * @returns {Boolean} Mute state, or false when the channel is not tracked
	 */
	function getMute(type, chNumber) {
		return state.trackedChannels[type]?.get(chNumber)?.mute ?? false
	}

	/**
	 * Track a send below its source channel. A send is considered new until its
	 * first response has initialized its values, so the caller can request them.
	 * @param {ChannelType} type - Type of the source channel
	 * @param {Number} fromChNum - Source channel number (1-indexed)
	 * @param {Number} toChNum - Target channel number (1-indexed)
	 * @param {String} feedbackId - Unique Companion feedback ID
	 * @param {String} feedbackType - Feedback definition ID
	 * @returns {{isNew: Boolean, send: Object}} Send state and whether its values need initialization
	 */
	function addSend(type, fromChNum, toChNum, feedbackId, feedbackType) {
		removeStaleSendSubscriptions(type, fromChNum, toChNum, feedbackId)

		// get source channel
		const { channel } = getOrCreateChannel(type, fromChNum)
		// get or create the send in the source channel
		let send = channel.sends.get(toChNum)
		const isNew = !send?.initialized
		if (!send) {
			send = { level: 0, mute: false, initialized: false, subscriptions: new Map() }
			channel.sends.set(toChNum, send)
		}
		// assign the feedback subscription to the send
		if (feedbackId !== undefined) send.subscriptions.set(feedbackId, feedbackType)
		return { isNew, send }
	}

	/**
	 * Remove one send feedback subscription.
	 * The send and the channel itself is only removed when no other feedback,
	 * manual subscription still needs it.
	 * @param {String} feedbackId - Unique Companion feedback ID
	 */
	function removeSend(feedbackId) {
		// iterate through all channels to find feedbackId in sends
		for (const channels of Object.values(state.trackedChannels)) {
			for (const [fromChNum, channel] of channels) {
				for (const [toChNum, send] of channel.sends) {
					// feedbackId not found in this send, continue searching
					if (!send.subscriptions.delete(feedbackId)) continue
					// delete the send when no other feedback subscription exists
					if (send.subscriptions.size === 0) channel.sends.delete(toChNum)
					// finally check if the source channel itself can be pruned
					pruneChannel(channels, fromChNum, channel)
					return // found the feedbackId, stop searching
				}
			}
		}
	}

	/**
	 * Remove a feedback's previous send subscription when it moved to another send.
	 * MANUAL tracking is intentionally ignored because multiple manual subscriptions can exist.
	 * @param {ChannelType} type - Type of the source channel
	 * @param {Number} fromChNum - Current source channel number (1-indexed)
	 * @param {Number} toChNum - Current target channel number (1-indexed)
	 * @param {String} feedbackId - Unique Companion feedback ID or MANUAL
	 * @returns {void}
	 */
	function removeStaleSendSubscriptions(type, fromChNum, toChNum, feedbackId) {
		if (feedbackId === undefined || feedbackId === MANUAL_ID) return

		const channels = state.trackedChannels[type]
		// loop through all channels and their sends
		for (const [existingFromChNum, channel] of channels) {
			for (const [existingToChNum, send] of channel.sends) {
				// This entry is not stale => skip
				if (existingFromChNum === fromChNum && existingToChNum === toChNum) continue
				// Delete feedback from the old send, if it exists there
				if (!send.subscriptions.delete(feedbackId)) continue
				// Remove the old send and run prune on it's channel
				if (send.subscriptions.size === 0) channel.sends.delete(existingToChNum)
				pruneChannel(channels, existingFromChNum, channel)
				return
			}
		}
	}

	/**
	 * Update values only for sends that are currently being tracked.
	 * @param {ChannelType} type - Type of the source channel
	 * @param {Number} fromChNum - Source channel number (1-indexed)
	 * @param {Number} toChNum - Target channel number (1-indexed)
	 * @param {Number|undefined} level - Raw decimal send-level value
	 * @param {Boolean|undefined} mute - Send mute state
	 */
	function setSend(type, fromChNum, toChNum, level, mute) {
		const send = state.trackedChannels[type]?.get(fromChNum)?.sends.get(toChNum)
		if (!send) return
		if (level !== undefined) send.level = level
		if (mute !== undefined) send.mute = mute
		send.initialized = true // future addSend calls will return isNew=false
	}

	/**
	 * Flatten nested sends into an array with 1-indexed source and target channel numbers.
	 * @param {ChannelType} type - Type of the source channels
	 * @returns {Array<{fromChNum: Number, toChNum: Number, send: Object}>} Sends with 1-indexed source and target channel numbers
	 */
	function getTrackedSends(type) {
		const results = []
		for (const [fromChNum, channel] of state.trackedChannels[type] ?? []) {
			for (const [toChNum, send] of channel.sends) results.push({ fromChNum, toChNum, send })
		}
		return results
	}

	/**
	 * Get a send's raw decimal level value.
	 * @param {ChannelType} type - Type of the source channel
	 * @param {Number} fromChNum - Source channel number (1-indexed)
	 * @param {Number} toChNum - Target channel number (1-indexed)
	 * @returns {Number} Raw decimal level value, or 0 when the send is not tracked
	 */
	function getSendLevel(type, fromChNum, toChNum) {
		return state.trackedChannels[type]?.get(fromChNum)?.sends.get(toChNum)?.level ?? 0
	}

	/**
	 * Get a send's mute state.
	 * @param {ChannelType} type - Type of the source channel
	 * @param {Number} fromChNum - Source channel number (1-indexed)
	 * @param {Number} toChNum - Target channel number (1-indexed)
	 * @returns {Boolean} Mute state, or false when the send is not tracked
	 */
	function getSendMute(type, fromChNum, toChNum) {
		return state.trackedChannels[type]?.get(fromChNum)?.sends.get(toChNum)?.mute ?? false
	}

	/**
	 * Replace all manual subscriptions for one channel type.
	 * Feedback subscriptions remain untouched.
	 * @param {ChannelType} type - ChannelType
	 * @param {String|Number[]} channels - Comma-separated or array-based channel numbers (1-indexed)
	 */
	function setManualTracking(type, channels) {
		const trackedChannels = state.trackedChannels[type]
		// delete all existing manual subscriptions for this channel type, check if channel can be pruned
		for (const [id, channel] of trackedChannels) {
			channel.subscriptions.delete(MANUAL_ID)
			pruneChannel(trackedChannels, id, channel)
		}

		// check if channels is a valid string or array, otherwise end here
		if (!channels || (typeof channels !== 'string' && !Array.isArray(channels))) return

		// parse channels into array and add them to tracked channels with MANUAL identifier
		const channelNumbers = parseIDsToArray(channels)
		log.debug('ManualTracking', {
			channelType: getChannelTypeName(type),
			channelNumbers: channelNumbers.join(','),
		})
		for (const chNumber of channelNumbers) addChannel(type, chNumber, MANUAL_ID, MANUAL_ID)
	}

	/**
	 * Check for the special MANUAL subscription on a channel.
	 * @param {ChannelType} type - ChannelType
	 * @param {Number} chNumber - Channel number (1-indexed)
	 * @returns {Boolean} Whether the channel is manually tracked
	 */
	function isManuallyTracked(type, chNumber) {
		return state.trackedChannels[type]?.get(chNumber)?.subscriptions.has(MANUAL_ID) ?? false
	}

	/**
	 * Store the most recently recalled preset.
	 * @param {Number} num - Preset number (1-indexed)
	 */
	function setPreset(num) {
		state.lastPreset = num
	}

	/**
	 * Get the most recently recalled preset.
	 * @returns {Number} Preset number (1-indexed), or 0 before a preset was received
	 */
	function getPreset() {
		return state.lastPreset
	}

	return {
		addChannel,
		removeChannel,
		setChannel,
		getTrackedChannelMap,
		getLevel,
		getMute,
		addSend,
		removeSend,
		setSend,
		getTrackedSends,
		getSendLevel,
		getSendMute,
		setManualTracking,
		isManuallyTracked,
		setPreset,
		getPreset,
	}
}
