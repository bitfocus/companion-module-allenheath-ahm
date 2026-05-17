import { ChannelType } from "../utility/constants.js"

/**
 * Creates initial state object
 * @returns State object
 */
export function createState() {
    return {
        trackedChannels: {
            [ChannelType.Input]: new Map(),
            [ChannelType.Zone]: new Map(),
            [ChannelType.ControlGroup]: new Map(),
        },
        manuallyTrackedChannels: {
            [ChannelType.Input]: [],
            [ChannelType.Zone]: [],
            [ChannelType.ControlGroup]: [],
        },
        lastPreset: 0
    }
}