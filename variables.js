import * as Helpers from './helpers.js'

export function getVariables() {
	const variables = []

	// generate input level variables
	let unitInAmount = this.numberOfInputs;
	for (let i = 1; i <= unitInAmount; i++) {
		variables.push({
			name: `Input ${i} Level`,
			variableId: Helpers.getVarNameInputLevel(i)
		})
	}

	return variables
}