import { create } from 'zustand'
import type { CirclesEventType } from '@circles-sdk/data'

import { EVENTS } from 'constants/events'
import { ONE } from '../constants/common'
import {
	BLOCK_TIME,
	HOURS_IN_DAY,
	MINUTES_IN_HOUR,
	SECONDS_IN_MINUTE,
	DAYS_IN_WEEK,
	DAYS_IN_MONTH
} from '../constants/time'

import { createSelectors } from './createSelectors'

export type PeriodKey = '1D' | '1H' | '1M' | '1W' | '12H'

export type ShowType = 'all' | 'avatar'

interface Period {
	label: string
	blocks: number
	unit: string
	value: number
	show: ShowType[]
}

interface State {
	eventTypes: Set<CirclesEventType>
	period: PeriodKey
	eventTypesAmount: Map<CirclesEventType, number>
}

interface Action {
	updateEventTypes: (event: CirclesEventType) => void
	updatePeriod: (period: PeriodKey) => void
	updateEventTypesAmount: (
		eventTypesAmount: Map<CirclesEventType, number>
	) => void
}

const TWELVE = 12

export const periods: Record<PeriodKey, Period> = {
	'1H': {
		label: '1H',
		blocks: (MINUTES_IN_HOUR * SECONDS_IN_MINUTE) / BLOCK_TIME,
		unit: 'hour',
		value: ONE,
		show: ['all']
	},
	'12H': {
		label: '12H',
		blocks: (TWELVE * MINUTES_IN_HOUR * SECONDS_IN_MINUTE) / BLOCK_TIME,
		unit: 'hour',
		value: TWELVE,
		show: ['all']
	},
	'1D': {
		label: '1D',
		blocks: (HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE) / BLOCK_TIME,
		unit: 'day',
		value: ONE,
		show: ['all', 'avatar']
	},
	'1W': {
		label: '1W',
		blocks:
			(DAYS_IN_WEEK * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE) /
			BLOCK_TIME,
		unit: 'week',
		value: ONE,
		show: ['avatar']
	},
	'1M': {
		label: '1M',
		blocks:
			(DAYS_IN_MONTH * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE) /
			BLOCK_TIME,
		unit: 'month',
		value: ONE,
		show: ['avatar']
	}
}

const useFilterStoreBase = create<Action & State>((set) => ({
	eventTypes: new Set(EVENTS),
	period: '12H' as PeriodKey,
	eventTypesAmount: new Map(),

	updateEventTypes: (event: CirclesEventType) =>
		set(({ eventTypes }) => {
			if (eventTypes.size === EVENTS.length) {
				return {
					eventTypes: new Set([event])
				}
			}
			if (eventTypes.size === ONE && eventTypes.has(event)) {
				return {
					eventTypes: new Set(EVENTS)
				}
			}

			return {
				eventTypes: eventTypes.has(event)
					? new Set([...eventTypes].filter((event_) => event_ !== event))
					: new Set([...eventTypes, event])
			}
		}),
	updatePeriod: (period: PeriodKey) => set(() => ({ period })),
	updateEventTypesAmount: (eventTypesAmount: Map<CirclesEventType, number>) =>
		set(() => ({ eventTypesAmount }))
}))

export const useFilterStore = createSelectors(useFilterStoreBase)
