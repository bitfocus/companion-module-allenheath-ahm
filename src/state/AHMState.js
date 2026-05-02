import { ChannelType } from "../utility/constants.js"

/**
 * Factory function tracking input, zone, and control group levels and mutes
 * @returns Internal helper functions
 */
export function trackAHMParams() {
    const trackedChannels = {
        [ChannelType.Input]: new Map(),
        [ChannelType.Zone]: new Map(),
        [ChannelType.ControlGroup]: new Map(),
    }
    const lastPreset = 0

    /**
     * Adds channel to tracked parameters
     * @param {String} type - input, mute, or cg
     * @param {Number} id - channel number
     */
    function addChannel(type, id) {
        if (!trackedChannels[type].has(id)) {
            trackedChannels[type].set(id, {
                level: '-inf',
                mute: false,
                sends: new Map()
            })
        }
    }

    /**
     * Removes channel from tracked parameters
     * @param {String} type - input, mute, or cg
     * @param {Number} id - channel number
     */
    function removeChannel(type, id) {
        trackedChannels[type].delete(id)
    }

    /**
     * Stores channel information in tracked channels
     * @param {String} type - input, mute, or cg
     * @param {Number} id - channel number
     * @param {String} level - level of channel in dBu
     * @param {Boolean} mute - incoming mute status of channel
     */
    function setChannel(type, id, level, mute) {
        let channel = trackedChannels[type]?.get(id)
        if (!trackedChannels[type].has(id)) {
            addChannel(type, id)
            channel = trackedChannels[type]?.get(id)
        }

        if (level !== undefined) channel.level = level
        if (mute !== undefined) channel.mute = mute
        console.log('SET INSTANCE', trackedChannels)
        console.log('SET STACK')
        console.log('MUTATE', type, id, mute, 'prev=', trackedChannels[type].get(id))
    }

    /**
     * Get list of tracked channels
     * @param {String} type - input, mute, or cg
     * @returns {Number[]} Array of tracked channel numbers
     */
    function getTrackedChannels(type) {
        return [...trackedChannels[type].keys()]
    }

    /**
     * Checks to see if tracked channel is in AHM state
     * @param {*} type - input, mute, or cg
     * @param {*} id - channel id
     * @returns {Boolean} - True/False if tracked channel exists in state
     */
    function hasTrackedChannel(type, id) {
        return trackedChannels[type]?.has(id)
    }

    /**
     * Adds an input or zone send to be tracked
     * @param {String} type 
     * @param {Number} idFrom 
     * @param {Number} idTo 
     */
    function addSend(type, idFrom, idTo) {
        const channel = trackedChannels[type].get(idFrom)
        if (!channel) return

        channel.sends.set(idTo, {
            level: '-inf',
            mute: false
        })
    }

    /**
     * Removed an input or zone send from tracking
     * @param {String} type 
     * @param {Number} idFrom 
     * @param {Number} idTo 
     */
    function removeSend(type, idFrom, idTo) {
        const channel = trackedChannels[type].get(idFrom)
        if (!channel) return

        channel.sends.delete(idTo)
    }

    /**
     * Updates send information in tracked channels
     * @param {String} type 
     * @param {Number} idFrom 
     * @param {Number} idTo 
     * @param {String} level 
     * @param {Boolean} mute 
     */
    function setSend(type, idFrom, idTo, level, mute) {
        const send = trackedChannels[type].get(idFrom)?.sends.get(idTo)
        if (!send) return

        send.level = level
        send.mute = mute
    }

    /**
     * Get list of tracked sends for a specific channel
     * @param {String} type - input, mute, or cg
     * @param {Number} id - channel number
     * @returns {Number[]} Array of tracked sends for specified channel
     */
    function getTrackedSends(type, id) {
        const channel = trackedChannels[type].get(id)
        return [...channel.sends.keys()]
    }

    /**
     * Get level of channel from tracked channels
     * @param {String} type - input, mute, or cg
     * @param {Number} id - channel number
     * @returns {String} Level of channel in dBu
     */
    function getLevel(type, id) {
        const reqLevelObject = trackedChannels[type].get(id)
        return reqLevelObject.level
    }

    /**
     * Get mute status of channel from tracked channels
     * @param {String} type - input, mute, or cg
     * @param {Number} id - channel number
     * @returns {Boolean} Mute status of channel
     */
    function getMute(type, id) {
        console.log('GET INSTANCE', trackedChannels)
        return trackedChannels[type]?.get(id)?.mute ?? false
    }

    /**
     * Get level of channel send from tracked channels
     * @param {String} type - input, mute, or cg
     * @param {Number} id - channel number
     * @returns {String} Level of channel in dBu
     */
    function getSendLevel(type, idfrom, idTo) {
        const send = trackedChannels[type].get(idFrom)?.sends.get(idTo)
        if (!send) return

        return send.level
    }

    /**
     * Get mute status of channel send from tracked channels
     * @param {String} type - input, mute, or cg
     * @param {Number} id - channel number
     * @returns {Boolean} Mute status of channel
     */
    function getSendMute(type, idFrom, idTo) {
        const send = trackedChannels[type].get(idFrom)?.sends.get(idTo)
        if (!send) return

        return send.mute
    }

    /**
     * Updates the state of the last preset number recalled
     * @param {Number} id 
     */
    function setPreset(id) {
        lastPreset = id
    }

    /**
     * Gets the last recalled preset
     * @returns {Number} The last preset recalled
     */
    function getPreset() {
        return lastPreset
    }

    return {
        addChannel,
        removeChannel,
        setChannel,
        addSend,
        removeSend,
        setSend,
        getTrackedChannels,
        hasTrackedChannel,
        getTrackedSends,
        getLevel,
        getMute,
        getSendLevel,
        getSendMute,
        setPreset,
        getPreset
    }
}