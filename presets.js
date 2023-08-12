import { combineRgb } from '@companion-module/base'

export function getPresets() {
	let presets = []

	const ColorWhite = combineRgb(255, 255, 255)
	const ColorBlack = combineRgb(0, 0, 0)
	const ColorRed = combineRgb(200, 0, 0)

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
				color: ColorWhite,
				bgcolor: ColorBlack,
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
					up: [],
				},
				{
					down: [
						{
							actionId: 'mute_input',
							options: {
								inputChannel: index,
								mute: false,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'inputMute',
					options: {
						input: index + 1,
					},
					style: {
						color: ColorWhite,
						bgcolor: ColorRed,
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
				color: ColorWhite,
				bgcolor: ColorBlack,
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
					up: [],
				},
				{
					down: [
						{
							actionId: 'mute_zone',
							options: {
								inputChannel: index,
								mute: false,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'zoneMute',
					options: {
						zone: parseInt(index) + 1,
					},
					style: {
						color: ColorWhite,
						bgcolor: ColorRed,
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
					color: ColorWhite,
					bgcolor: ColorBlack,
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
						up: [],
					},
					{
						down: [
							{
								actionId: 'input_to_zone',
								options: {
									inputChannel: parseInt(input),
									number: zone,
									mute: false,
								},
							},
						],
						up: [],
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
							color: ColorWhite,
							bgcolor: ColorRed,
						},
					},
				],
			})
		}
	}
	return presets
}
