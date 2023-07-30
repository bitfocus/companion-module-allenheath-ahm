import { combineRgb } from '@companion-module/base'

export function getFeedbacks() {
	const feedbacks = {}

	feedbacks['inputMute'] = {
		type: 'advanced',
		name: 'Change background when input on mute',
		description: 'When you mute the input change color',
		options: [
			{
				type: 'colorpicker',
				label: 'Foreground color',
				id: 'fg',
				default: combineRgb(255, 255, 255),
			},
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'bg',
				default: combineRgb(255, 0, 0),
			},
			{
				type: 'textinput',
				label: 'Select input',
				id: 'input',
				default: 1,
			},
		],
		callback: (feedback, bank) => {
			if (inputsMute[parseInt(feedback.options.input) - 1] == 1) {
				return {
					color: feedback.options.fg,
					bgcolor: feedback.options.bg,
				}
			}
		},
	}

	feedbacks['zoneMute'] = {
		type: 'advanced',
		name: 'Change background when zone on mute',
		description: 'When you mute the zone change color',
		options: [
			{
				type: 'colorpicker',
				label: 'Foreground color',
				id: 'fg',
				default: combineRgb(255, 255, 255),
			},
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'bg',
				default: combineRgb(255, 0, 0),
			},
			{
				type: 'textinput',
				label: 'Select zone',
				id: 'zone',
				default: 1,
			},
		],
		callback: (feedback, bank) => {
			if (zonesMute[parseInt(feedback.options.zone) - 1] == 1) {
				return {
					color: feedback.options.fg,
					bgcolor: feedback.options.bg,
				}
			}
		},
	}

	feedbacks['inputToZoneMute'] = {
		type: 'advanced',
		name: 'Change background when input to zone on mute',
		description: 'When you mute the input on a zone change color',
		options: [
			{
				type: 'colorpicker',
				label: 'Foreground color',
				id: 'fg',
				default: combineRgb(255, 255, 255),
			},
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'bg',
				default: combineRgb(255, 0, 0),
			},
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
			if (inputsToZonesMute[parseInt(feedback.options.input) - 1][parseInt(feedback.options.zone) - 1] == 1) {
				return {
					color: feedback.options.fg,
					bgcolor: feedback.options.bg,
				}
			}
		},
	}

	return feedbacks
}
