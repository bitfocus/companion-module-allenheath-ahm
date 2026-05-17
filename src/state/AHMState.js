import { ChannelType } from '../utility/constants.js'
import { createState } from './core.js'
import { createAutoTracking } from './autoTrack.js'
import { createManualTracking } from './manualTrack.js'

/**
 * Factory function tracking input, zone, and control group levels and mutes
 * @returns Internal helper functions
 */
export function trackAHMParams() {
	const state = createState()

	Object.assign(state, createAutoTracking(state))
	Object.assign(state, createManualTracking(state))

	function reset() {
		Object.assign(state, createState())
	}

	return {
		state,
		reset,
		...state,
	}
}
