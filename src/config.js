import { Regex } from "@companion-module/base"

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
        label: 'Type of Device (Re-enable required after change)',
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
        regex: Regex.NUMBER
    }
]