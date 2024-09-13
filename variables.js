import * as Helpers from './helpers.js'

export function getVariables() {
	const variableDefinitions = []
	const variableInitValuesArray = []

	// generate input level variables
	let unitInAmount = this.numberOfInputs;
	for (let i = 1; i <= unitInAmount; i++) {
		let varId = Helpers.getVarNameInputLevel(i)
		variableDefinitions.push({
			name: `Input ${i} Level`,
			variableId: varId
		})
		// initialize with ?
		variableInitValuesArray.push({
			[varId]: '?'
		})
	}

	// flatten init Value Array (convert into single object instead of array)
	const variableInitValues = variableInitValuesArray.reduce((acc, obj) => {
		return {...acc, ...obj};
	}, {});

	return [variableDefinitions, variableInitValues]
}