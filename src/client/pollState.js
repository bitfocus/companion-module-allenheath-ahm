import { ChannelType } from "../utility/constants.js"
import { sleep } from "../utility/helpers.js"
import { requestLevelInfo, requestMuteInfo } from "../utility/formatHexMIDI.js"

export function pollStateTimer(
    socket,
    interval = 10000,
    state,
    onError = console.error) {
    let stopped = false
    let next = Date.now()

    async function tick() {
        if (stopped) return
        next += interval

        try {
            if (socket.destroyed) {
                throw new Error("Socket is not connected")
            }

            // build list of things to check here
            let inputs = state.getTrackedChannels(ChannelType.Input)
            let zones = state.getTrackedChannels(ChannelType.Zone)
            let cgs = state.getTrackedChannels(ChannelType.ControlGroup)

            console.log(inputs.length, zones.length, cgs.length, Date.now())

            let req

            for (const i of inputs) {
                req = requestLevelInfo(ChannelType.Input, i)
                socket.send(req)
                await sleep(150)

                req = requestMuteInfo(ChannelType.Input, i)
                socket.send(req)
                await sleep(150)
            }

            for (const z of zones) {
                req = requestLevelInfo(ChannelType.Zone, z)
                socket.send(req)
                await sleep(150)

                req = requestMuteInfo(ChannelType.Zone, z)
                socket.send(req)
                await sleep(150)
            }

            for (const c of cgs) {
                req = requestLevelInfo(ChannelType.ControlGroup, c)
                socket.send(req)
                await sleep(150)

                req = requestMuteInfo(ChannelType.ControlGroup, c)
                socket.send(req)
                await sleep(150)
            }

        } catch (err) {
            onError(err)
        }

        setTimeout(tick, interval)
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
        stop
    }
}