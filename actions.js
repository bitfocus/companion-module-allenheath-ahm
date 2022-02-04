module.exports = {
	/**
	 * Get the available actions.
	 *
	 * @returns {Object[]} the available actions
	 * @access public
	 * @since 1.2.0
	 */

	getActions() {
		this.chCount = 64
		this.sceneCount = 500

		let actions = {}

		this.listOptions = (name, qty, offset) => {
			this.CHOICES = []
			for (let i = 1; i <= qty; i++) {
				this.CHOICES.push({ label: `${name} ${i}`, id: i + offset })
			}
			return [
				{
					type: 'dropdown',
					label: name,
					id: 'number',
					default: 0,
					choices: this.CHOICES,
					minChoicesForSearch: 0,
				},
			]
		}

		this.muteOptions = (name, qty, offset) => {
			this.CHOICES = []
			for (let i = 1; i <= qty; i++) {
				this.CHOICES.push({ label: `${name} ${i}`, id: i + offset })
			}
			return [
				{
					type: 'dropdown',
					label: name,
					id: 'inputChannel',
					default: 0,
					choices: this.CHOICES,
					minChoicesForSearch: 0,
				},
				{
					type: 'checkbox',
					label: 'Mute',
					id: 'mute',
					default: true,
				},
			]
		}

		actions['mute_input'] = {
			label: 'Mute Input',
			options: this.muteOptions('Mute Channel', 64, -1),
		}

		actions['mute_zone'] = {
			label: 'Mute Zone',
			options: this.muteOptions('Mute zone', 64, -1),
		}

		actions['scene_recall'] = {
			label: 'Recall a scene',
			options: this.listOptions('Recall scene', 500, -1),
		}

		actions['input_to_zone'] = {
			label: 'input to zone',
			options: this.muteOptions('Mute Channel', 64, -1).concat(this.listOptions('zone', 64, -1))
		}

		// actions['get_phantom'] = {
		// 	label: 'Get phantom info',
		// 	options: this.listOptions('Input', 64, -1),
		// }

		return actions
	},
}
