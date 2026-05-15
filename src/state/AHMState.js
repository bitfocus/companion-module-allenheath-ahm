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
    const trackedSends = {
        [ChannelType.Input]: new Map(),
        [ChannelType.Zone]: new Map()
    }
    let lastPreset = 0

    /**
     * Adds channel to tracked parameters
     * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
     * @param {Number} id - channel number
     */
    function addChannel(type, id) {
        if (trackedChannels[type].has(id)) return

        trackedChannels[type].set(id, {
            level: '-inf',
            mute: false,
        })
    }

    /**
     * Removes channel from tracked parameters
     * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
     * @param {Number} id - channel number
     */
    function removeChannel(type, id) {
        trackedChannels[type].delete(id)
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
        let channel = trackedChannels[type]?.get(id)
        if (!trackedChannels[type].has(id)) {
            return
        }

        if (level !== undefined) channel.level = level
        if (mute !== undefined) channel.mute = mute
        console.log('SET INSTANCE', trackedChannels)
        console.log('SET STACK')
        console.log('MUTATE', type, id, mute, 'prev=', trackedChannels[type].get(id))
    }

    /**
     * Get list of tracked channels
     * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
     * @returns {Number[]} Array of tracked channel numbers
     */
    function getTrackedChannels(type) {
        return [...(trackedChannels[type]?.keys() ?? [])]
    }

    /**
     * Checks to see if tracked channel is in AHM state
     * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
     * @param {*} id - channel id
     * @returns {Boolean} - True/False if tracked channel exists in state
     */
    function hasTrackedChannel(type, id) {
        return trackedChannels[type]?.has(id)
    }

    /**
     * Adds an input or zone send to be tracked
     * @param {ChannelType} type - ChannelType (Input or Zone)
     * @param {Number} idFrom 
     * @param {Number} idTo 
     */
    function addSend(type, idFrom, idTo) {
        if (trackedSends[type]?.has(idFrom)) return

        trackedSends[type].set(idFrom, {
            channel: idTo,
            level: '-inf',
            mute: false,
        })
    }

    /**
     * Removed an input or zone send from tracking
     * @param {ChannelType} typeFrom - ChannelType (Input or Zone)
     * @param {Number} idFrom
     * @param {Number} idTo 
     */
    function removeSend(type, idFrom, idTo) {
        const send = trackedSends[type]?.get(idFrom)
        if (!send) return

        send.delete(idTo)
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
        const send = trackedSends[type]?.get(idFrom)
        if (!send) return
        idTo = send.channel
        if (level !== undefined) send.level = level
        if (mute !== undefined) send.mute = mute
    }

    /**
     * Get list of tracked sends for a specific channel type
     * @param {ChannelType} type - ChannelType (Input or Zone)
     * @param {Number} idFrom 
     * @returns {Number[]} Array of tracked sends for specified channel
     */
    function getTrackedSends(type, idFrom) {
        return [...(trackedSends[type]?.get(idFrom)?.values() ?? [])]
    }

    /**
     * Checks to see if tracked send for a specific channel is in AHM state
     * @param {ChannelType} type - ChannelType (Input or Zone)
     * @param {Number} id - channel id
     * @returns {Boolean} - True/False if tracked channel exists in state
     */
    function hasTrackedSend(type, idFrom, idTo) {
        return trackedSends[type]?.has(idFrom)
    }

    /**
     * Get level of channel from tracked channels
     * @param {ChannelType} type - ChannelType (Input or Zone)
     * @param {Number} id - channel number
     * @returns {Number} Level of channel as integer from API guide
     */
    function getLevel(type, id) {
        const reqLevelObject = trackedChannels[type].get(id)
        return reqLevelObject.level
    }

    /**
     * Get mute status of channel from tracked channels
     * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
     * @param {Number} id - channel number
     * @returns {Boolean} Mute status of channel
     */
    function getMute(type, id) {
        return trackedChannels[type]?.get(id)?.mute ?? false
    }

    /**
     * Get level of channel send from tracked channels
     * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
     * @param {Number} id - channel number
     * @returns {Number} Level of channel as integer from API guide
     */
    function getSendLevel(type, idfrom, idTo) {
        const send = trackedSends[type].get(idTo)
        console.log('GET SEND INSTANCE', send)
        if (!send) return

        return send.level
    }

    /**
     * Get mute status of channel send from tracked channels
     * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
     * @param {Number} id - channel number
     * @returns {Boolean} Mute status of channel
     */
    function getSendMute(type, idFrom, idTo) {
        const send = trackedSends[type].get(idTo)
        console.log('GET SEND INSTANCE', send)
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
        hasTrackedSend,
        getLevel,
        getMute,
        getSendLevel,
        getSendMute,
        setPreset,
        getPreset
    }
}