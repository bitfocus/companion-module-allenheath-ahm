import * as Helpers from './helpers.js'

export function getVariables() {
	const variableDefinitions = []
	const variableInitValuesArray = []

	// generate input level variables
	let unitInAmount = this.numberOfInputs
	for (let i = 1; i <= unitInAmount; i++) {
		let varId = Helpers.getVarNameInputLevel(i)
		variableDefinitions.push({
			name: `Input ${i} Level`,
			variableId: varId,
		})
		// initialize with ?
		variableInitValuesArray.push({
			[varId]: '?',
		})
	}

	// generate zone level variables
	let unitZoneAmount = this.numberOfZones
	for (let i = 1; i <= unitZoneAmount; i++) {
		let varId = Helpers.getVarNameZoneLevel(i)
		variableDefinitions.push({
			name: `Zone ${i} Level`,
			variableId: varId,
		})
		// initialize with ?
		variableInitValuesArray.push({
			[varId]: '?',
		})
	}

	// generate control group level variables
	let unitControlGroupAmount = this.numberOfControlGroups
	for (let i = 1; i <= unitControlGroupAmount; i++) {
		let varId = Helpers.getVarNameCGLevel(i)
		variableDefinitions.push({
			name: `Control Group ${i} Level`,
			variableId: varId,
		})
		// initialize with ?
		variableInitValuesArray.push({
			[varId]: '?',
		})
	}

	// flatten init Value Array (convert into single object instead of array)
	const variableInitValues = variableInitValuesArray.reduce((acc, obj) => {
		return { ...acc, ...obj }
	}, {})

	return [variableDefinitions, variableInitValues]
}
