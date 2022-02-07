module.exports = {
	getPresets(inputsMute, zonesMute) {
		let presets = []

		// Mute Inputs
		for (let index = 0; index < inputsMute.length; index++) {
			presets.push({
				category: 'Mute input',
				label: `Mute Input ${parseInt(index) + 1}`,
				bank: {
					style: 'text',
					text: `Mute Input ${parseInt(index) + 1}`,
					size: '14',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: true,
				},
				actions: [
					{
						action: 'mute_input',
						options: {
							inputChannel: index,
							mute: true,
						},
					},
				],
				release_actions: [
					{
						action: 'mute_input',
						options: {
							inputChannel: index,
							mute: false,
						},
					},
				],
				feedbacks: [
					{
						type: 'inputMute',
						options: {
							input: index + 1,
						},
						style: {
							color: this.rgb(255, 255, 255),
							bgcolor: this.rgb(0, 0, 0),
						},
					},
				],
			})
		}

		// Mute Zones
		for (let index = 0; index < zonesMute.length; index++) {
			presets.push({
				category: 'Mute zones',
				label: `Mute zone ${parseInt(index) + 1}`,
				bank: {
					style: 'text',
					text: `Mute zone ${parseInt(index) + 1}`,
					size: '14',
					color: this.rgb(255,255,255),
					bgcolor: this.rgb(0, 0, 0),
					latch: true,
				},
				actions: [
					{
						action: 'mute_zone',
						options: {
							inputChannel: index,
							mute: true,
						},
					},
				],
				release_actions: [
					{
						action: 'mute_zone',
						options: {
							inputChannel: index,
							mute: false,
						},
					},
				],
				feedbacks: [
					{
						type: 'zoneMute',
						options: {
							zone: parseInt(index) + 1,
						},
						style: {
							color: this.rgb(255, 255, 255),
							bgcolor: this.rgb(0, 0, 0),
						},
					},
				],
			})
		}

		// Mute input to Zone
		for (let input = 0; input < inputsMute.length; input++) {
			for (let zone = 0; zone < zonesMute.length; zone++) {
				presets.push({
					category: `Mute input ${parseInt(input) + 1} to Zone`,
					label: `Mute input ${parseInt(input) + 1} to zone ${parseInt(zone) + 1}`,
					bank: {
						style: 'text',
						text: `Mute input ${parseInt(input) + 1} to zone ${parseInt(zone) + 1}`,
						size: '14',
						color: this.rgb(255,255,255),
						bgcolor: this.rgb(0, 0, 0),
						latch: true,
					},
					actions: [
						{
							action: 'input_to_zone',
							options: {
								inputChannel: parseInt(input),
								number: zone,
								mute: true,
							},
						},
					],
					release_actions: [
						{
							action: 'input_to_zone',
							options: {
								inputChannel: parseInt(input),
								number: zone,
								mute: false,
							},
						},
					],
					feedbacks: [
						{
							type: 'inputToZoneMute',
							options: {
								input: parseInt(input) + 1,
								zone: zone + 1,
							},
							style: {
								color: this.rgb(255, 255, 255),
								bgcolor: this.rgb(0, 0, 0),
							},
						},
					],
				})
			}
		}
		return presets
	},
}
