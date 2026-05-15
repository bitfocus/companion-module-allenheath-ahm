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
    let lastPreset = 0

    /**
     * Adds channel to tracked parameters
     * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
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

        return trackedChannels[type].get(id)
    }

    /**
     * Removes channel from tracked parameters
     * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
     * @param {Number} id - channel number
     */
    function removeChannel(type, id) {
        trackedChannels[type]?.delete(id)
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
                mute: false
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
        const channel = trackedChannels[type]?.get(idFrom)
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
     * @param {Number} idFrom 
     * @returns {Number[]} Array of tracked sends for specified channel
     */
    function getSendStates(type, idFrom) {
        return [...(trackedChannels[type]?.get(idFrom)?.sends?.values() ?? [])]
    }

    /**
     * Get level of channel from tracked channels
     * @param {ChannelType} type - ChannelType (Input or Zone)
     * @param {Number} id - channel number
     * @returns {Number} Level of channel as integer from API guide
     */
    function getLevel(type, id) {
        return trackedChannels[type]
            ?.get(id)
            ?.level ?? '-inf'
    }

    /**
     * Get mute status of channel from tracked channels
     * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
     * @param {Number} id - channel number
     * @returns {Boolean} Mute status of channel
     */
    function getMute(type, id) {
        return trackedChannels[type]
            ?.get(id)
            ?.mute ?? false
    }

    /**
     * Get level of channel send from tracked channels
     * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
     * @param {Number} id - channel number
     * @returns {Number} Level of channel as integer from API guide
     */
    function getSendLevel(type, idFrom, idTo) {
        return trackedChannels[type]
            ?.get(idFrom)
            ?.sends
            ?.get(idTo)
            ?.level ?? '-inf'
    }

    /**
     * Get mute status of channel send from tracked channels
     * @param {ChannelType} type - ChannelType (Input, Zone, or ControlGroup)
     * @param {Number} id - channel number
     * @returns {Boolean} Mute status of channel
     */
    function getSendMute(type, idFrom, idTo) {
        return trackedChannels[type]
            ?.get(idFrom)
            ?.sends
            ?.get(idTo)
            ?.mute ?? false
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
        getSendStates,
        getLevel,
        getMute,
        getSendLevel,
        getSendMute,
        setPreset,
        getPreset
    }
}