import { TCPHelper, InstanceStatus } from "@companion-module/base"
import { processIncomingData } from "./processIncomingData.js"

export function TCPClient({companion}, state) {
    let midiSocket

    function destroyTCP() {
        if (!midiSocket) return

        midiSocket.destroy()
        midiSocket = undefined
    }

    function initTCP(host, port) {
        destroyTCP()

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
            processIncomingData(data, {companion}, state)
        })

        midiSocket.on('connect', () => {
            companion.log('debug', `MIDI Connected to ${host}`)
            companion.updateStatus(InstanceStatus.Ok)
            // companion.performReadoutAfterConnected()
        })
    }

    function sendCommand(buffers) {
        if (buffers.length !== 0) {
            for (let i = 0; i < buffers.length; i++) {
                if (!midiSocket) return
                companion.log('debug', `sending ${buffers[i].toString('hex')} via MIDI TCP`)
                midiSocket.send(buffers[i])
                }
            }
        }

    return {
        destroyTCP,
        initTCP,
        sendCommand
    }

}
