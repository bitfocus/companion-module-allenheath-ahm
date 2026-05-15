import { ChannelType, SendInfoType } from "../utility/constants.js"
import { sleep } from "../utility/helpers.js"
import { requestLevelInfo, requestMuteInfo, requestSendInfo } from "../utility/formatHexMIDI.js"

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
            let inputSends = state.getTrackedSends(ChannelType.Input)
            let zoneSends = state.getTrackedSends(ChannelType.Zone)

            console.log(inputs.length, zones.length, cgs.length, Date.now())

            let req

            for (const i of inputs) {
                console.log('polling for input ', i)
                socket.send(requestLevelInfo(ChannelType.Input, i))
                await sleep(150)

                socket.send(requestMuteInfo(ChannelType.Input, i))
                await sleep(150)
            }

            for (const z of zones) {
                socket.send(requestLevelInfo(ChannelType.Zone, z))
                await sleep(150)

                socket.send(requestMuteInfo(ChannelType.Zone, z))
                await sleep(150)
            }

            for (const c of cgs) {
                socket.send(requestLevelInfo(ChannelType.ControlGroup, c))
                await sleep(150)

                socket.send(requestMuteInfo(ChannelType.ControlGroup, c))
                await sleep(150)
            }

            for (const sendFrom of inputSends) {
                console.log('sendfrom', sendFrom)
                // let sendCh = isend.
                // socket.send(requestSendInfo(ChannelType.Input, SendInfoType.LEVEL, ))
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