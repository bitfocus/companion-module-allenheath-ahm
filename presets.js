import { combineRgb } from '@companion-module/base'

export function getPresets() {
	let presets = []

	const ColorWhite = combineRgb(255, 255, 255)
	const ColorBlack = combineRgb(0, 0, 0)
	const ColorRed = combineRgb(200, 0, 0)

	// Mute Inputs
	for (let index = 0; index < this.numberOfInputs; index++) {
		presets.push({
			type: 'button',
			category: 'Mute Input',
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
								mute_number: index,
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
								mute_number: index,
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
	for (let index = 0; index < this.numberOfZones; index++) {
		presets.push({
			type: 'button',
			category: 'Mute Zones',
			name: `Mute Zone ${parseInt(index) + 1}`,
			options: {},
			style: {
				text: `Mute Zone ${parseInt(index) + 1}`,
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
								mute_number: index,
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
								mute_number: index,
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
	for (let input = 0; input < this.numberOfInputs; input++) {
		for (let zone = 0; zone < this.numberOfZones; zone++) {
			presets.push({
				type: 'button',
				category: `Mute Input ${parseInt(input) + 1} to Zone`,
				name: `Mute Input ${parseInt(input) + 1} to Zone ${parseInt(zone) + 1}`,
				options: {},
				style: {
					text: `Mute Input ${parseInt(input) + 1} to Zone ${parseInt(zone) + 1}`,
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
									mute_number: parseInt(input),
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
									mute_number: parseInt(input),
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
