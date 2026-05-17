import { ChannelType, SendInfoType } from '../utility/constants.js'
import { sleep } from '../utility/helpers.js'
import { requestLevelInfo, requestMuteInfo, requestSendInfo } from '../utility/formatHexMIDI.js'

/**
 * AHM state polling factory function.
 * @param {*} socket
 * @param {Number} interval - Poll rate in ms
 * @param {*} state
 * @param {*} onError
 * @returns {Function[]}
 */
export function pollStateTimer(socket, interval = 10000, state, onError = console.error) {
	let stopped = false
	let next = Date.now()

	async function tick() {
		if (stopped) return
		next += interval

		try {
			if (socket.destroyed) {
				throw new Error('Socket is not connected')
			}

			const requests = [
				...buildChReqs(ChannelType.Input, state.getTrackedChannelMap(ChannelType.Input)),
				...buildChReqs(ChannelType.Zone, state.getTrackedChannelMap(ChannelType.Zone)),
				...buildChReqs(ChannelType.ControlGroup, state.getTrackedChannelMap(ChannelType.ControlGroup)),
				...buildSendReqs(ChannelType.Input, state.getAllSendStates(ChannelType.Input)),
				...buildSendReqs(ChannelType.Zone, state.getAllSendStates(ChannelType.Zone)),
			]

			for (const req of requests) {
				socket.queue(req)
			}
		} catch (err) {
			onError(err)
		}

		setTimeout(tick, interval)
	}

	function buildChReqs(type, ids) {
		const requests = []

		for (const id of ids) {
			requests.push(requestLevelInfo(type, id), requestMuteInfo(type, id))
		}

		return requests
	}

	function buildSendReqs(type, sends) {
		const requests = []

		for (const { idFrom, idTo } of sends) {
			requests.push(
				requestSendInfo(type, SendInfoType.LEVEL, idFrom, idTo),
				requestSendInfo(type, SendInfoType.MUTE, idFrom, idTo),
			)
		}

		return requests
	}

	function start() {
		stopped = false
		next = Date.now()
		tick()
	}

	function stop() {
		stopped = true
	}

	return {
		start,
		stop,
	}
}
