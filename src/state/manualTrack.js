import { ChannelType } from "../utility/constants.js"
import { parseIDsToArray } from "../utility/helpers.js"

export function createManualTracking(state) {
    /**
     * Loads manually-tracked channels into state, overwriting
     * @param {ChannelType} type 
     * @param {String} ids 
     */
    function setManualTracking(type, ids) {
        if (!ids || typeof ids !== 'string' && !Array.isArray(ids)) {
            state.manuallyTrackedChannels[type] = []
            return
        }

        const trackingArray = parseIDsToArray(ids)
        state.manuallyTrackedChannels[type] = trackingArray
        console.log(`manually tracked ${type}: ${state.manuallyTrackedChannels[type]} ${typeof(state.manuallyTrackedChannels[type])}`) // returns object

        for (const m of trackingArray) {
            console.log('logging m', m, typeof(m)) // returns string
            state.addChannel(type, m)
        }        
    }

    /**
     * Checks if channel of ChannelType is being manually tracked
     * @param {ChannelType} type 
     * @param {Number} id 
     * @returns {Boolean}
     */
    function isManuallyTracked(type, id) {
        return state.manuallyTrackedChannels[type]?.includes(id) ?? False
    }

    return {
        setManualTracking,
        isManuallyTracked
    }
}