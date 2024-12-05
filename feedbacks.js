import { combineRgb } from '@companion-module/base'
import * as Constants from './constants.js'

export function getFeedbacks() {
	const feedbacks = {}

	const ColorWhite = combineRgb(255, 255, 255)
	const ColorRed = combineRgb(200, 0, 0)

	// builds an object containing all relevant information to monitor a feedback of some type
	this.buildFeedbackMonitoringObject = (feedback) => {
		let extractedFeedbackInfo = {}
		extractedFeedbackInfo.id = feedback.id

		switch (feedback.feedbackId) {
			case 'inputToZoneMute':
				extractedFeedbackInfo.type = Constants.MonitoredFeedbackType.MuteState
				extractedFeedbackInfo.sendType = Constants.SendType.InputToZone
				extractedFeedbackInfo.channel = feedback.options.input
				extractedFeedbackInfo.sendChannel = feedback.options.zone			  
				break;
	
			default:
				extractedFeedbackInfo.type = Constants.MonitoredFeedbackType.Undefined
		}

		return extractedFeedbackInfo
	}


	feedbacks['inputMute'] = {
		type: 'boolean',
		name: 'Change background when input on mute',
		description: 'When you mute the input change color',
		defaultStyle: {
			color: ColorWhite,
			bgcolor: ColorRed,
		},
		options: [
			{
				type: 'textinput',
				label: 'Select input',
				id: 'input',
				default: 1,
			},
		],
		callback: (feedback, bank) => {
			return this.inputsMute[parseInt(feedback.options.input) - 1] == 1
		},
	}

	feedbacks['zoneMute'] = {
		type: 'boolean',
		name: 'Change background when zone on mute',
		description: 'When you mute the zone change color',
		defaultStyle: {
			color: ColorWhite,
			bgcolor: ColorRed,
		},
		options: [
			{
				type: 'textinput',
				label: 'Select zone',
				id: 'zone',
				default: 1,
			},
		],
		callback: (feedback, bank) => {
			return this.zonesMute[parseInt(feedback.options.zone) - 1] == 1
		},
	}

	feedbacks['inputToZoneMute'] = {
		type: 'boolean',
		name: 'Change background when input to zone on mute',
		description: 'When you mute the input on a zone change color',
		defaultStyle: {
			color: ColorWhite,
			bgcolor: ColorRed,
		},
		options: [
			{
				type: 'textinput',
				label: 'Select input',
				id: 'input',
				default: 1,
			},
			{
				type: 'textinput',
				label: 'Select zone',
				id: 'zone',
				default: 1,
			},
		],
		callback: (feedback, bank) => {
			return this.inputsToZonesMute[parseInt(feedback.options.input)]?.[parseInt(feedback.options.zone)] == 1
		},
		subscribe: (feedback) => {
			// add this feedback to the monitored feedbacks
			this.monitoredFeedbacks.push(this.buildFeedbackMonitoringObject(feedback))
		},
		unsubscribe: (feedback) => {
			// remove this feedback from the monitored feedbacks
			// find index of feedback with this ID in the array
			const feedbackIndex = this.monitoredFeedbacks.findIndex((monFeedback) => monFeedback.id == feedback.id);
			if (feedbackIndex > -1) { // only splice array when feedback was found
				this.monitoredFeedbacks.splice(feedbackIndex, 1); // 2nd parameter means remove one item only
			}
		}
	}

	return feedbacks
}
