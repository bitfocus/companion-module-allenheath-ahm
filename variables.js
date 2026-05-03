import * as Helpers from './src/utility/helpers.js'

export function getVariables(numberOfInputs, numberOfZones) {
	const variableDefinitions = []
	const variableInitValuesArray = []

	// generate input level variables
	let unitInAmount = numberOfInputs
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
	let unitZoneAmount = numberOfZones
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
	let unitControlGroupAmount = 32
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

	// Variable for recalled preset data
	variableDefinitions.push({
		name: `Current Preset`,
		variableId: 'currentPreset',
	})
	// initialize with '0'
	variableInitValuesArray.push({
		'currentPreset': '0',
	})

	// flatten init Value Array (convert into single object instead of array)
	const variableInitValues = variableInitValuesArray.reduce((acc, obj) => {
		return { ...acc, ...obj }
	}, {})

	return [variableDefinitions, variableInitValues]
}
