import { Regex } from '@companion-module/base'

/**
 * Module config in separate file
 */
export const configFields = [
	{
		type: 'static-text',
		id: 'upgradeNotice',
		label: 'Upgrade Notice',
		value:
			'Users upgrading from the 2.x module should fill out the Manual Channel Tracking ' +
			'section with channel numbers for all inputs, zones, and control groups level global variables are needed for. ' +
			'<br>Feedbacks on channels (local variable) will automatically track the channel. No global variable is generated in that case.',
		default: false,
		width: 12,
	},
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
			'Specify inputs, zones, and control groups to have levels tracked in global variables. ' +
			'Any channel not tracked here can still be tracked using local variables and the "Input Level", ' +
			'"Zone Level", and "Control Group Level" feedbacks. <br> <b>NOTE:</b> using feedbacks with local variables ' +
			'will NOT create global variables.',
		default: false,
		width: 12,
	},
	{
		type: 'textinput',
		id: 'manTrackInputs',
		label: 'Inputs',
		description: 'Separate inputs by commas',
		width: 12,
	},
	{
		type: 'textinput',
		id: 'manTrackZones',
		label: 'Zones',
		description: 'Separate zones by commas',
		width: 12,
	},
	{
		type: 'textinput',
		id: 'manTrackCGs',
		label: 'Control Groups',
		description: 'Separate control groups by commas',
		width: 12,
	},
]
