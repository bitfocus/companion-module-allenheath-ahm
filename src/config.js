import { Regex } from '@companion-module/base'

/**
 * Module config in seperate file
 */
export const configFields = [
	{
		type: 'textinput',
		id: 'host',
		label: 'Device IP',
		width: 6,
		default: '',
		regex: Regex.IP,
	},
	{
		type: 'dropdown',
		id: 'ahm_type',
		label: 'Type of Device',
		width: 6,
		choices: [
			{ id: '64', label: 'AHM-64' },
			{ id: '32', label: 'AHM-32' },
			{ id: '16', label: 'AHM-16' },
		],
		default: '64',
	},
	{
		type: 'number',
		id: 'pollRate',
		label: 'Refresh rate (in ms)',
		width: 6,
		default: 10000,
		min: 5000,
		max: 120000,
		regex: Regex.NUMBER,
	},
	{
		type: 'static-text',
		id: 'manTrack-help',
		label: 'Manual Channel Tracking',
		value:
			'Specify channels to be tracked in global variables. ' +
			'This creates a variable for each input, zone, or control group that returns its level. ' +
			'Any channel not tracked here can still be tracked using local variables and the "Input Level", ' +
			'"Zone Level", and "Control Group Level" feedbacks. NOTE: using feedbacks with local variables ' +
			'will NOT create global variables; use the fields below instead.',
		default: false,
		width: 12,
	},
	{
		type: 'textinput',
		id: 'manTrackInputs',
		label: 'Inputs',
		description: 'Seperate inputs by commas',
		width: 12,
	},
	{
		type: 'textinput',
		id: 'manTrackZones',
		label: 'Zones',
		description: 'Seperate zones by commas',
		width: 12,
	},
	{
		type: 'textinput',
		id: 'manTrackCGs',
		label: 'Control Groups',
		description: 'Seperate control groups by commas',
		width: 12,
	},
]
