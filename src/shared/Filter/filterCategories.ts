import type { CirclesEventType } from '@circles-sdk/data'

import { V1_EVENTS, V2_EVENTS, UNKNOWN_EVENTS } from 'constants/events'

export interface FilterCategory {
	label: string
	key: string
	events: CirclesEventType[]
}

// Define aliases for common actions
export const ALIASES: Record<string, CirclesEventType[]> = {
	'All Transfers': [
		'CrcV1_Transfer',
		'CrcV1_HubTransfer',
		'CrcV2_TransferSingle',
		'CrcV2_TransferBatch',
		'CrcV2_Erc20WrapperTransfer',
		'CrcV2_StreamCompleted'
	],
	'All Trust Actions': ['CrcV1_Trust', 'CrcV2_Trust'],
	'All Registrations': [
		'CrcV1_Signup',
		'CrcV1_OrganizationSignup',
		'CrcV2_RegisterHuman',
		'CrcV2_RegisterGroup',
		'CrcV2_RegisterOrganization'
	]
}

export const FILTER_CATEGORIES: FilterCategory[] = [
	{
		label: 'Aliases',
		key: 'aliases',
		events: [] // This will be handled separately
	},
	{
		label: 'Circles V1',
		key: 'v1',
		events: V1_EVENTS
	},
	{
		label: 'Circles V2',
		key: 'v2',
		events: V2_EVENTS
	},
	{
		label: 'Safe',
		key: 'safe',
		events: []
	},
	{
		label: 'Unknown',
		key: 'unknown',
		events: UNKNOWN_EVENTS
	}
]
