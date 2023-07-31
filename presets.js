import { combineRgb } from '@companion-module/base'

export function getPresets() {
	let presets = []

	// Mute Inputs
	for (let index = 0; index < this.inputsMute.length; index++) {
		presets.push({
			type: 'button',
			category: 'Mute input',
			name: `Mute Input ${parseInt(index) + 1}`,
			options: {},
			style: {
				text: `Mute Input ${parseInt(index) + 1}`,
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'mute_input',
							options: {
								inputChannel: index,
								mute: true,
							},
						},
					],
					up: [
						{
							actionId: 'mute_input',
							options: {
								inputChannel: index,
								mute: false,
							},
						},
					],
				},
			],
			feedbacks: [
				{
					feedbackId: 'inputMute',
					options: {
						input: index + 1,
					},
					style: {
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(0, 0, 0),
					},
				},
			],
		})
	}

	// Mute Zones
	for (let index = 0; index < this.zonesMute.length; index++) {
		presets.push({
			type: 'button',
			category: 'Mute zones',
			name: `Mute zone ${parseInt(index) + 1}`,
			options: {},
			style: {
				text: `Mute zone ${parseInt(index) + 1}`,
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'mute_zone',
							options: {
								inputChannel: index,
								mute: true,
							},
						},
					],
					up: [
						{
							actionId: 'mute_zone',
							options: {
								inputChannel: index,
								mute: false,
							},
						},
					],
				},
			],
			feedbacks: [
				{
					feedbackId: 'zoneMute',
					options: {
						zone: parseInt(index) + 1,
					},
					style: {
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(0, 0, 0),
					},
				},
			],
		})
	}

	// Mute input to Zone
	for (let input = 0; input < this.inputsMute.length; input++) {
		for (let zone = 0; zone < this.zonesMute.length; zone++) {
			presets.push({
				type: 'button',
				category: `Mute input ${parseInt(input) + 1} to Zone`,
				name: `Mute input ${parseInt(input) + 1} to zone ${parseInt(zone) + 1}`,
				options: {},
				style: {
					text: `Mute input ${parseInt(input) + 1} to zone ${parseInt(zone) + 1}`,
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'input_to_zone',
								options: {
									inputChannel: parseInt(input),
									number: zone,
									mute: true,
								},
							},
						],
						up: [
							{
								actionId: 'input_to_zone',
								options: {
									inputChannel: parseInt(input),
									number: zone,
									mute: false,
								},
							},
						],
					},
				],
				feedbacks: [
					{
						feedbackId: 'inputToZoneMute',
						options: {
							input: parseInt(input) + 1,
							zone: zone + 1,
						},
						style: {
							color: combineRgb(255, 255, 255),
							bgcolor: combineRgb(0, 0, 0),
						},
					},
				],
			})
		}
	}
	return presets
}
