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
