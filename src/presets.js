import { Colors } from './utility/constants.js'

export function getPresets(numberOfInputs, numberOfZones) {
	let presets = []

	// Mute Inputs
	for (let index = 0; index < numberOfInputs; index++) {
		presets.push({
			type: 'button',
			category: 'Mute Input',
			name: `Mute Input ${parseInt(index) + 1}`,
			options: {},
			style: {
				text: `Mute Input ${parseInt(index) + 1}`,
				size: '14',
				color: Colors.White,
				bgcolor: Colors.Black,
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
						color: Colors.White,
						bgcolor: Colors.Red,
					},
				},
			],
		})
	}

	// Mute Zones
	for (let index = 0; index < numberOfZones; index++) {
		presets.push({
			type: 'button',
			category: 'Mute Zones',
			name: `Mute Zone ${parseInt(index) + 1}`,
			options: {},
			style: {
				text: `Mute Zone ${parseInt(index) + 1}`,
				size: '14',
				color: Colors.White,
				bgcolor: Colors.Black,
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
						color: Colors.White,
						bgcolor: Colors.Red,
					},
				},
			],
		})
	}

	// Mute Control Groups
	for (let index = 0; index < 32; index++) {
		presets.push({
			type: 'button',
			category: 'Mute Control Groups',
			name: `Mute CG ${parseInt(index) + 1}`,
			options: {},
			style: {
				text: `Mute Control Group ${parseInt(index) + 1}`,
				size: '14',
				color: Colors.White,
				bgcolor: Colors.Black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'mute_controlgroup',
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
							actionId: 'mute_controlgroup',
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
					feedbackId: 'cgMute',
					options: {
						cg: parseInt(index) + 1,
					},
					style: {
						color: Colors.White,
						bgcolor: Colors.Red,
					},
				},
			],
		})
	}

	// Mute input to Zone
	for (let input = 0; input < numberOfInputs; input++) {
		for (let zone = 0; zone < numberOfZones; zone++) {
			presets.push({
				type: 'button',
				category: `Mute Input ${parseInt(input) + 1} to Zone`,
				name: `Mute Input ${parseInt(input) + 1} to Zone ${parseInt(zone) + 1}`,
				options: {},
				style: {
					text: `Mute Input ${parseInt(input) + 1} to Zone ${parseInt(zone) + 1}`,
					size: '14',
					color: Colors.White,
					bgcolor: Colors.Black,
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
							color: Colors.White,
							bgcolor: Colors.Red,
						},
					},
				],
			})
		}
	}
	return presets
}
