import { Colors, SendType, MonitoredFeedbackType, ChannelType } from './src/utility/constants.js'

export function getFeedbacks(state) {
	const feedbacks = {}

	feedbacks['inputMute'] = {
		type: 'boolean',
		name: 'Change background when input on mute',
		description: 'When you mute the input change color',
		defaultStyle: {
			color: Colors.White,
			bgcolor: Colors.Red,
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
			let input = parseInt(feedback.options.input)
			console.log('feedback log', input, feedback.options.input)
			if (!state.hasTrackedChannel(ChannelType.Input, input)) {
				state.addChannel(ChannelType.Input, input)
			}

			let value = state.getMute(ChannelType.Input, input)
			console.log('feedback eval:', input, value)
			return value
		},
		unsubscribe: (feedback) => {
			let input = parseInt(feedback.options.input)
			state.removeChannel(ChannelType.Input, input)
		}
	}

	feedbacks['zoneMute'] = {
		type: 'boolean',
		name: 'Change background when zone on mute',
		description: 'When you mute the zone change color',
		defaultStyle: {
			color: Colors.White,
			bgcolor: Colors.Red,
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
			let zone = parseInt(feedback.options.zone)
			if (!state.hasTrackedChannel(ChannelType.Zone, zone)) {
				state.addChannel(ChannelType.Zone, zone)
			}
			
			return state.getMute(ChannelType.Zone, zone)
		},
		unsubscribe: (feedback) => {
			let zone = parseInt(feedback.options.zone)
			state.removeChannel(ChannelType.Zone, zone)
		}
	}

	feedbacks['cgMute'] = {
		type: 'boolean',
		name: 'Change background when control group on mute',
		description: 'When you mute the control group change color',
		defaultStyle: {
			color: Colors.White,
			bgcolor: Colors.Red,
		},
		options: [
			{
				type: 'textinput',
				label: 'Select control group',
				id: 'cg',
				default: 1,
			},
		],
		callback: (feedback, bank) => {
			let cg = parseInt(feedback.options.cg)
			if (!state.hasTrackedChannel(ChannelType.ControlGroup, cg)) {
				state.addChannel(ChannelType.ControlGroup, cg)
			}
			
			return state.getMute(ChannelType.ControlGroup, cg)
		},
		unsubscribe: (feedback) => {
			let cg = parseInt(feedback.options.cg)
			state.removeChannel(ChannelType.ControlGroup, cg)
		}
	}

	feedbacks['inputToZoneMute'] = {
		type: 'boolean',
		name: 'Change background when input to zone on mute',
		description: 'When you mute the input on a zone change color',
		defaultStyle: {
			color: Colors.White,
			bgcolor: Colors.Red,
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
			state.addChannel(ChannelType.Input, feedback.options.input)
			state.addSend(ChannelType.Input, feedback.options.input, feedback.options.zone)
			return state.getSendMute(ChannelType.Input, feedback.options.input, feedback.options.zone)
		},
		unsubscribe: (feedback) => {
			state.removeSend(ChannelType.Input, feedback.options.input, feedback.options.zone)
		},
	}

	feedbacks['currentPreset'] = {
		type: 'boolean',
		name: 'Active Preset',
		description: 'Reacts when a specific preset has been recalled',
		defaultStyle: {
			color: Colors.White,
			bgcolor: Colors.Blue,
		},
		options: [
			{
				type: 'textinput',
				label: 'Preset number',
				id: 'preset',
				useVariables: true,
				default: 1,
			},
		],
		callback: (feedback) => {
			let currentPreset = state.getPreset()
			return currentPreset == feedback.options.preset 
		},
	}

	return feedbacks
}
