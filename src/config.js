import { Regex } from "@companion-module/base"

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
            { id: 'ahm64', label: 'AHM-64' },
            { id: 'ahm32', label: 'AHM-32' },
            { id: 'ahm16', label: 'AHM-16' },
        ],
        default: 'ahm64',
    },
]