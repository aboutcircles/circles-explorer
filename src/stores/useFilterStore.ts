import type { CirclesEventType } from '@circles-sdk/data'
import { isNil } from 'utils/isNil'
import { isAddress } from 'viem'
import { create } from 'zustand'

import { EVENTS } from 'constants/events'
import { ONE } from '../constants/common'
import {
	BLOCK_TIME,
	DAYS_IN_MONTH,
	DAYS_IN_WEEK,
	HOURS_IN_DAY,
	MINUTES_IN_HOUR,
	SECONDS_IN_MINUTE
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
	search: string | null
}

interface Action {
	updateEventTypes: (event: CirclesEventType) => void
	updateEventTypesBatch: (events: CirclesEventType[]) => void
	updatePeriod: (period: PeriodKey) => void
	updateEventTypesAmount: (
		eventTypesAmount: Map<CirclesEventType, number>
	) => void
	updateSearch: (search: string) => void
	syncWithUrl: (parameters: {
		search?: string | null
		filter?: string | null
	}) => void
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

const updateURL = (state: State) => {
	const url = new URL(window.location.href)

	if (state.search) {
		url.searchParams.set('search', state.search)
	} else {
		url.searchParams.delete('search')
	}

	if (state.eventTypes.size < EVENTS.length) {
		url.searchParams.set('filter', [...state.eventTypes].join(','))
	} else {
		url.searchParams.delete('filter')
	}

	window.history.pushState({}, '', url.toString())
}

const useFilterStoreBase = create<Action & State>((set) => ({
	eventTypes: new Set(EVENTS),
	period: '12H' as PeriodKey,
	eventTypesAmount: new Map(),
	search: null,

	updateEventTypes: (event: CirclesEventType) =>
		set((state) => {
			let newEventTypes: Set<CirclesEventType>

			if (state.eventTypes.size === EVENTS.length) {
				newEventTypes = new Set([event])
			} else if (state.eventTypes.size === ONE && state.eventTypes.has(event)) {
				newEventTypes = new Set(EVENTS)
			} else {
				newEventTypes = state.eventTypes.has(event)
					? new Set([...state.eventTypes].filter((event_) => event_ !== event))
					: new Set([...state.eventTypes, event])
			}

			const newState = {
				...state,
				eventTypes: newEventTypes
			}

			updateURL(newState)
			return newState
		}),
	updateEventTypesBatch: (events: CirclesEventType[]) =>
		set((state) => {
			if (events.length === 0) return state

			let newEventTypes: Set<CirclesEventType>
			const allEventsSelected = events.every((event) =>
				state.eventTypes.has(event)
			)

			if (allEventsSelected) {
				// If all events in batch are selected, remove them
				newEventTypes = new Set(
					[...state.eventTypes].filter((event) => !events.includes(event))
				)
				// If removing these events would make the set empty, select all events
				if (newEventTypes.size === 0) {
					newEventTypes = new Set(EVENTS)
				}
			} else {
				// If not all events in batch are selected, select them all
				newEventTypes = new Set([...state.eventTypes, ...events])
			}

			const newState = {
				...state,
				eventTypes: newEventTypes
			}

			updateURL(newState)
			return newState
		}),
	updatePeriod: (period: PeriodKey) => set(() => ({ period })),
	updateEventTypesAmount: (eventTypesAmount: Map<CirclesEventType, number>) =>
		set(() => ({ eventTypesAmount })),
	updateSearch: (search: string) => {
		set((state) => {
			const newState = {
				...state,
				search,
				eventTypes: new Set(EVENTS),
				period: isAddress(search) ? '1W' : ('12H' as PeriodKey)
			}
			updateURL(newState)
			return newState
		})
	},
	syncWithUrl: (parameters) => {
		if (!isNil(parameters.search)) {
			set({ search: parameters.search })
		}
		if (!isNil(parameters.filter)) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			const selectedEvents = parameters.filter.split(',') as CirclesEventType[]
			set({ eventTypes: new Set(selectedEvents) })
		}
	}
}))

export const useFilterStore = createSelectors(useFilterStoreBase)
