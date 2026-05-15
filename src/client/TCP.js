import { TCPHelper, InstanceStatus } from "@companion-module/base"
import { parseResponse } from "./parseResponse.js"
import { sleep } from "../utility/helpers.js"

export function TCPClient({companion}, state) {
    let midiSocket
    let txQueue
    let queueRunning = false

    function destroy() {
        if (!midiSocket) return

        midiSocket.destroy()
        midiSocket = undefined
    }

    function init(host, port) {
        destroy()

        if (!host || !port) return 

        midiSocket = new TCPHelper(host, port)

        midiSocket.on('status_change', (status, message) => {
            companion.updateStatus(status)
        })

        midiSocket.on('error', (err) => {
            companion.log('error', 'Error: ' + err.message)
            companion.updateStatus(InstanceStatus.ConnectionFailure)
        })

        midiSocket.on('data', (data) => {
            parseResponse(data, {companion}, state)
        })

        midiSocket.on('connect', () => {
            companion.log('debug', `MIDI Connected to ${host}`)
            companion.updateStatus(InstanceStatus.Ok)
            // companion.performReadoutAfterConnected()
        })
    }

    function queue(buffers) {
        txQueue.push(buffers)

        startQueue()
    }

    async function startQueue() {
        // if queue is already running, let it be
        if (queueRunning) return
        queueRunning = true

        while (txQueue.length > 0) {
            const txBuffer = txQueue.shift()
            if (!txBuffer) continue

            try {
                send(txBuffer)
            } catch (e) {
                companion.log('error', 'Buffer sending error: ' + e)
            }
        }

        await sleep(150)
    }

    function send(buffers) {
        if (buffers.length !== 0) {
            for (let i = 0; i < buffers.length; i++) {
                if (!midiSocket) return
                companion.log('debug', `sending ${buffers[i].toString('hex')} via MIDI TCP`)
                midiSocket.send(buffers[i])
            }
        }
    }

    return {
        destroy,
        init,
        send,
        queue
    }

}
