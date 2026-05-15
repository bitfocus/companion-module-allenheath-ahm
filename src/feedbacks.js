import { Colors, SendType, MonitoredFeedbackType, ChannelType } from './utility/constants.js'
import { getDbuValue } from './utility/helpers.js'

export function getFeedbacks(state) {
	const feedbacks = {}

	feedbacks['inputMute'] = {
		type: 'boolean',
		name: 'Input Mute',
		description: 'Change background when input on mute',
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

			state.addChannel(ChannelType.Input, input)
			
			let value = state.getMute(ChannelType.Input, input)
			console.log('feedback eval:', input, value)
			return value
		},
		unsubscribe: (feedback) => {
			let input = parseInt(feedback.options.input)
			state.removeChannel(ChannelType.Input, input)
		}
	}

	feedbacks['inputLevel'] = {
		type: 'value',
		name: 'Input Level',
		description: 'Returns level of input in dBu',
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

			state.addChannel(ChannelType.Input, input)
			
			console.log('feedback getLevel ', state.getLevel(ChannelType.Input, input))
			return getDbuValue(state.getLevel(ChannelType.Input, input))
		},
		unsubscribe: (feedback) => {
			let input = parseInt(feedback.options.input)
			state.removeChannel(ChannelType.Input, input)
		}
	}

	feedbacks['zoneMute'] = {
		type: 'boolean',
		name: 'Zone Mute',
		description: 'Change background when zone on mute',
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

			state.addChannel(ChannelType.Zone, zone)
			
			return state.getMute(ChannelType.Zone, zone)
		},
		unsubscribe: (feedback) => {
			let zone = parseInt(feedback.options.zone)
			state.removeChannel(ChannelType.Zone, zone)
		}
	}

	feedbacks['zoneLevel'] = {
		type: 'value',
		name: 'Zone Level',
		description: 'Returns level of zone in dBu',
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
			console.log('feedback log', zone, feedback.options.zone)

			state.addChannel(ChannelType.Zone, zone)

			console.log('feedback getLevel ', state.getLevel(ChannelType.Zone, zone))
			return getDbuValue(state.getLevel(ChannelType.Zone, zone))
		},
		unsubscribe: (feedback) => {
			let zone = parseInt(feedback.options.zone)
			state.removeChannel(ChannelType.Zone, zone)
		}
	}

	feedbacks['cgMute'] = {
		type: 'boolean',
		name: 'Control Group Mute',
		description: 'Change background when control group on mute',
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
 
			state.addChannel(ChannelType.ControlGroup, cg)
			
			return state.getMute(ChannelType.ControlGroup, cg)
		},
		unsubscribe: (feedback) => {
			let cg = parseInt(feedback.options.cg)
			state.removeChannel(ChannelType.ControlGroup, cg)
		}
	}

	feedbacks['cgLevel'] = {
		type: 'value',
		name: 'Control Group Level',
		description: 'Returns level of control group in dBu',
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
			console.log('feedback log', cg, feedback.options.cg)

			state.addChannel(ChannelType.ControlGroup, cg)

			console.log('feedback getLevel ', state.getLevel(ChannelType.ControlGroup, cg))
			return getDbuValue(state.getLevel(ChannelType.ControlGroup, cg))
		},
		unsubscribe: (feedback) => {
			let cg = parseInt(feedback.options.cg)
			state.removeChannel(ChannelType.ControlGroup, cg)
		}
	}

	feedbacks['inputToZoneMute'] = {
		type: 'boolean',
		name: 'Input to Zone - Mute',
		description: 'Change background when input to zone on mute',
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
			let input = parseInt(feedback.options.input) - 1
			let zone = parseInt(feedback.options.zone) - 1

			state.addSend(ChannelType.Input, input, zone)

			return state.getSendMute(ChannelType.Input, input, zone)
		},
		unsubscribe: (feedback) => {
			let input = parseInt(feedback.options.input) - 1
			let zone = parseInt(feedback.options.zone) - 1
			state.removeSend(ChannelType.Input, input, zone)
		},
	}

	feedbacks['inputToZoneLevel'] = {
		type: 'value',
		name: 'Input to Zone - Level',
		description: 'Returns value of input sent to zone',
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
			let input = parseInt(feedback.options.input)
			let zone = parseInt(feedback.options.zone)

			state.addSend(ChannelType.Input, input, zone)

			return getDbuValue(state.getSendLevel(ChannelType.Input, input, zone))
		},
		unsubscribe: (feedback) => {
			let input = parseInt(feedback.options.input)
			let zone = parseInt(feedback.options.zone)
			state.removeSend(ChannelType.Input, input, zone)
		},
	}

	feedbacks['currentPreset'] = {
		type: 'boolean',
		name: 'Active Preset',
		description: 'Feedback when a specific preset has been recalled',
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
