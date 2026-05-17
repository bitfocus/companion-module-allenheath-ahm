import { parseIDsToArray, getVarNameInputLevel, getVarNameZoneLevel, getVarNameCGLevel } from './utility/helpers.js'

/**
 * Sets up Companion custom variables
 * @param {String[]} manTrackInputs
 * @param {String[]} manTrackZones
 * @param {String[]} manTrackCGs
 * @returns
 */
export function getVariables(manTrackInputs, manTrackZones, manTrackCGs) {
	const variableDefinitions = []
	const variableInitValuesArray = []
	console.log('mantrackins', manTrackInputs, typeof manTrackInputs)

	const cleanManIns = parseIDsToArray(manTrackInputs)
	const cleanManZones = parseIDsToArray(manTrackZones)
	const cleanManCGs = parseIDsToArray(manTrackCGs)

	// generate input level variables
	if (cleanManIns.length != 0) {
		for (const i of cleanManIns) {
			let varId = getVarNameInputLevel(i)
			variableDefinitions.push({
				name: `Input ${i} Level`,
				variableId: varId,
			})
			// initialize with ?
			variableInitValuesArray.push({
				[varId]: '?',
			})
		}
	}

	// generate zone level variables
	if (cleanManZones.length != 0) {
		for (const i of cleanManZones) {
			let varId = getVarNameZoneLevel(i)
			variableDefinitions.push({
				name: `Zone ${i} Level`,
				variableId: varId,
			})
			// initialize with ?
			variableInitValuesArray.push({
				[varId]: '?',
			})
		}
	}

	// generate control group level variables
	if (cleanManCGs.length != 0) {
		for (const i of cleanManCGs) {
			let varId = getVarNameCGLevel(i)
			variableDefinitions.push({
				name: `Control Group ${i} Level`,
				variableId: varId,
			})
			// initialize with ?
			variableInitValuesArray.push({
				[varId]: '?',
			})
		}
	}

	// Variable for recalled preset data
	variableDefinitions.push({
		name: `Current Preset`,
		variableId: 'currentPreset',
	})
	// initialize with '0'
	variableInitValuesArray.push({
		currentPreset: '0',
	})

	// flatten init Value Array (convert into single object instead of array)
	const variableInitValues = variableInitValuesArray.reduce((acc, obj) => {
		return { ...acc, ...obj }
	}, {})

	return [variableDefinitions, variableInitValues]
}
