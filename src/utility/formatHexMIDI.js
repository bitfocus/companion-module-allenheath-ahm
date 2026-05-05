import { checkIfValueOfEnum, getChTypeOfSendType, getSendChTypeOfSendType } from "./helpers.js"
import { ChannelType, SendType } from "./constants.js"

/**
 * Requests channel level
 * @param {String} chType 
 * @param {String} chNumber 
 * @returns { Buffer } Formulated command buffer
 */
export function requestLevelInfo(chType, chNumber) {
    if (checkIfValueOfEnum(chType, ChannelType) == false) return 
    console.log('requested channel', chNumber, 'outputting channel', chNumber-1)

    return [
        Buffer.from([
            0xf0,
            0x00,
            0x00,
            0x1a,
            0x50,
            0x12,
            0x01,
            0x00,
            parseInt(chType),
            0x01,
            0x0b,
            0x17,
            parseInt(chNumber) - 1,
            0xf7,
        ]),
    ]
}

/**
 * Requests if channel is muted
 * @param {String} chType 
 * @param {String} chNumber 
 * @returns { Buffer } Formulated command buffer
 */
export function requestMuteInfo(chType, chNumber) {
    if (checkIfValueOfEnum(chType, ChannelType) == false) return

    return [
        Buffer.from([
            0xf0,
            0x00,
            0x00,
            0x1a,
            0x50,
            0x12,
            0x01,
            0x00,
            parseInt(chType),
            0x01,
            0x09,
            parseInt(chNumber),  //- 1,
            0xf7,
        ]),
    ]
}

/**
 * Requests if input send to zone is muted
 * @param {*} sendType 
 * @param {String} chNumber 
 * @param {String} sendChNumber 
 * @returns { Buffer } Formulated command buffer
 */
export function requestSendMuteInfo(sendType, chNumber, sendChNumber) {
    if (checkIfValueOfEnum(sendType, SendType) == false) return

    // get types of send
    let chType = getChTypeOfSendType(sendType)
    let sendChType = getSendChTypeOfSendType(sendType)

    console.log(
        `requestSendMuteInfo: chType: ${chType}, ch: ${chNumber}, sendChType: ${sendChType}, sendChNumber: ${sendChNumber}`,
    )

    return [
        Buffer.from([
            0xf0,
            0x00,
            0x00,
            0x1a,
            0x50,
            0x12,
            0x01,
            0x00,
            parseInt(chType),
            0x01,
            0x0f,
            0x03,
            parseInt(chNumber) - 1,
            parseInt(sendChType),
            parseInt(sendChNumber) - 1,
            0xf7,
        ]),
    ]
}

/**
 * Prepares MIDI string for set level action
 * @param {*} action - Action instance options
 * @param {ChannelType} type 
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export async function setLevelCallback(action, type) {
    if (checkIfValueOfEnum(type, ChannelType) == false) {
        return
    }

    let typeCodeSetLevel = parseInt(0xb0 + type) // type code for Command "Channel Level"
    let typeCodeGetLevel = parseInt(0x00 + type) // type code for Command "Get Channel Level"
    let chNumber = parseInt(action.options.setlvl_ch_number)
    let levelDec = parseInt(action.options.level)

    return [
        Buffer.from([typeCodeSetLevel, 0x63, chNumber, typeCodeSetLevel, 0x62, 0x17, typeCodeSetLevel, 0x06, levelDec]),
    ]
}

/**
 * Prepares MIDI string for inc/dec level action
 * @param {*} action - Action instance options
 * @param {ChannelType} type 
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export async function incDecLevelCallback(action, type) {
    if (checkIfValueOfEnum(type, ChannelType) == false) {
        return
    }

    let typeCodeSetLevel = parseInt(0xb0 + type) // type code for Command "Level Increment / Decrement"
    let typeCodeGetLevel = parseInt(0x00 + type) // type code for Command "Get Channel Level"
    let chNumber = parseInt(action.options.incdec_ch_number)
    let incdecSelector = action.options.incdec == 'inc' ? 0x7f : 0x3f

    return [
        Buffer.from([
            typeCodeSetLevel,
            0x63,
            chNumber,
            typeCodeSetLevel,
            0x62,
            0x20,
            typeCodeSetLevel,
            0x06,
            incdecSelector,
        ]),
    ]
}

/**
 * Prepares MIDI string for inc/dec send level action
 * @param {*} action - Action instance options
 * @param {ChannelType} type 
 * @returns {Buffer} Hex MIDI buffer ready to send
 */
export async function incDecSendLevelCallback(action, type) {
    if (checkIfValueOfEnum(type, SendType) == false) {
        return
    }

    let chType = getChTypeOfSendType(type)
    let sendChType = getSendChTypeOfSendType(type)
    let chNumber = parseInt(action.options.incdec_ch_number)
    let sendChNumber = parseInt(action.options.number)
    let incdecSelector = action.options.incdec == 'inc' ? 0x7f : 0x3f

    return [
        Buffer.from([
            0xf0,
            0x00,
            0x00,
            0x1a,
            0x50,
            0x12,
            0x01,
            0x00,
            chType,
            0x04,
            chNumber,
            sendChType,
            sendChNumber,
            incdecSelector,
            0xf7,
        ]),
    ]
}