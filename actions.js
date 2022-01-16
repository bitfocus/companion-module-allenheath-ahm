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

		this.sceneOptions = (name , qty) => {
			this.CHOICES = []
			for (let i = 1; i <= qty; i++) {
				this.CHOICES.push({ label: `${name} ${i}`, id: i -1 })
			}
			return [
				{
					type: 'dropdown',
					label: 'Scene',
					id: 'sceneNumber',
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

		// Actions for iLive
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
			options: this.sceneOptions('Recall scene', 500)
		}

		return actions
	},
}
