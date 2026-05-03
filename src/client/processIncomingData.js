import { ChannelType,  } from "../utility/constants.js"
import { getVarNameInputLevel, 
    getVarNameZoneLevel, 
    getVarNameCGLevel,
    getDbuValue } from "../utility/helpers.js"

export function processIncomingData(data, {companion}, state) {
    console.log(data)

    if (data[0] === 0xF0) {
        // receiving SysEx data
        if (data[9] === 0x03) {
            // receiving send mute data

            /* console.log(
                `Input ${parseInt(data[10]) + 1} to zone Zone ${parseInt(data[12]) + 1} ${
                    data[13] == 63 ? 'unmute' : 'mute'
                }`
            )
            this.log(
                'debug',
                `Input ${parseInt(data[10]) + 1} to zone Zone ${parseInt(data[12]) + 1} ${
                    data[13] == 63 ? 'unmute' : 'mute'
                }`
            )*/

            let inputNum = parseInt(data[10]) + 1
            let zoneNum = parseInt(data[12]) + 1
            let muteState = data[13] == 63 ? 0 : 1

            this.updateSendMuteState(Constants.SendType.InputToZone, inputNum, zoneNum, muteState)
            companion.checkFeedbacks('inputToZoneMute')
            return
        }
        return
    }

    if (data[1] === 0x63 && data[3] === 0x62) {
        // second value of hex:63 and fourth value of hex:62 means level data
        if (data[0] === 0xB0) {
            // first value of hex:b0 means channel level data

            let inputLvlChangeNum = parseInt(data[2]) + 1
            let levelInput = parseInt(data[6])
            let variableNameInput = getVarNameInputLevel(inputLvlChangeNum)

            companion.log(
                'debug',
                `Input ${inputLvlChangeNum} has new level: ${levelInput} (dec) = ${getDbuValue(levelInput)} (dBu), changing variable ${variableNameInput}`,
            )

            // Put value in state store if it's being tracked
            state.setChannel(ChannelType.Input, inputLvlChangeNum, levelInput, undefined)

            companion.setVariableValues({ [variableNameInput]: getDbuValue(levelInput) })

            return
        }
        if (data[0] === 0xB1) {
            // first value of hex:b1 means zone level data

            let zoneLvlChangeNum = parseInt(data[2]) + 1
            let levelZone = parseInt(data[6])
            let variableNameZone = getVarNameZoneLevel(zoneLvlChangeNum)

            companion.log(
                'debug',
                `Zone ${zoneLvlChangeNum} has new level: ${levelZone} (dec) = ${this.getDbuValue(levelZone)} (dBu), changing variable ${variableNameZone}`,
            )

            // Put value in state store if it's being tracked
            state.setChannel(ChannelType.Zone, zoneLvlChangeNum, levelZone, undefined)

            companion.setVariableValues({ [variableNameZone]: getDbuValue(levelZone) })

            return
        }
        if (data[0] === 0xB2) {
            // first value of hex:b2 means control group level data

            let cgLvlChangeNum = parseInt(data[2]) + 1
            let levelCG = parseInt(data[6])
            let variableNameCG = getVarNameCGLevel(cgLvlChangeNum)

            companion.log(
                'debug',
                `Control Group ${cgLvlChangeNum} has new level: ${levelCG} (dec) = ${getDbuValue(levelCG)} (dBu), changing variable ${variableNameCG}`,
            )

            // Put value in state store if it's being tracked
            state.setChannel(ChannelType.ControlGroup, cgLvlChangeNum, levelCG, undefined)

            companion.setVariableValues({ [variableNameCG]: getDbuValue(levelCG) })

            return
        }
    }

    if (data[0] === 0x90 || data[0] === 0x91 || data[0] === 0x92) {
        // first value of hex:90, hex:91, or hex:92 means mute of some kind
        if (data[0] === 0x90) {
            // first value of hex:90 means channel mute
            // data[2] 63 == unmute, 127 == mute
            let mute = undefined
            switch (data[2]) {
                case 127:
                    mute = true
                    break;
                case 63:
                    mute = false
                    break;
                default:
                    break;
            }

            let channel = parseInt(data[1]) + 1
            state.setChannel(ChannelType.Input, channel, undefined, mute)

            companion.checkFeedbacks('inputMute')
            console.log('FINAL STATE', state.getMute(ChannelType.Input, channel))
            return
        }
        if (data[0] === 0x91) {
            // first value of hex:91 means zone mute
            let mute = data[2] == 63 ? false : true
            let channel = parseInt(data[1]) + 1
            state.setChannel(ChannelType.Zone, channel, undefined, mute)

            companion.checkFeedbacks('zoneMute')
            return
        }
        if (data[0] === 0x92) {
            // first value of hex:92 means channel group mute
            let mute = data[2] == 63 ? false : true
            let channel = parseInt(data[1]) + 1
            state.setChannel(ChannelType.ControlGroup, channel, undefined, mute)

            companion.checkFeedbacks('cgMute')
            return
        }
    }

    if (data[0] === 0xB0 && data[3] === 0xC0) {
        // first value of hex:B0 and third value of hex:C0 means preset recall data

        let presetNum = Number(data[4])
        let presetNumOffset = Number(data[2])
        let preset = presetNum + (presetNumOffset * 128) + 1
        state.setPreset(preset)

        companion.log('info', `Preset ${this.currentPreset} recalled`)
        companion.setVariableValues({currentPreset: this.currentPreset})
        companion.checkFeedbacks('currentPreset')
        return
    }
}
