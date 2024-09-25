import { create } from 'zustand'
import type { Address } from 'viem'

import type { EventType } from 'types/events'
import { EVENTS } from 'constants/events'
import { ONE } from '../constants/common'
import {
	BLOCK_TIME,
	HOURS_IN_DAY,
	MINUTES_IN_HOUR,
	SECONDS_IN_MINUTE
} from '../constants/time'

import { createSelectors } from './createSelectors'

export type PeriodKey = '1D' | '1H' | '6H'

interface Period {
	label: string
	blocks: number
	unit: string
	value: number
}

interface State {
	search: Address | null
	eventTypes: Set<EventType>
	period: PeriodKey
}

interface Action {
	updateSearch: (search: Address) => void
	updateEventTypes: (event: EventType) => void
	updatePeriod: (period: PeriodKey) => void
}

const SIX = 6

export const periods: Record<PeriodKey, Period> = {
	'1H': {
		label: '1H',
		blocks: (MINUTES_IN_HOUR * SECONDS_IN_MINUTE) / BLOCK_TIME,
		unit: 'hour',
		value: ONE
	},
	'6H': {
		label: '6H',
		blocks: (SIX * MINUTES_IN_HOUR * SECONDS_IN_MINUTE) / BLOCK_TIME,
		unit: 'hour',
		value: SIX
	},
	'1D': {
		label: '1D',
		blocks: (HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE) / BLOCK_TIME,
		unit: 'day',
		value: ONE
	}
}

const useFilterStoreBase = create<Action & State>((set) => ({
	search: null,
	eventTypes: new Set(EVENTS),
	period: '1H',

	updateSearch: (search: Address) => set(() => ({ search })),
	updateEventTypes: (event: EventType) =>
		set(({ eventTypes }) => ({
			eventTypes: eventTypes.has(event)
				? new Set([...eventTypes].filter((event_) => event_ !== event))
				: new Set([...eventTypes, event])
		})),
	updatePeriod: (period: PeriodKey) => set(() => ({ period }))
}))

export const useFilterStore = createSelectors(useFilterStoreBase)
