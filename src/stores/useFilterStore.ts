import type { CirclesEventType } from '@circles-sdk/data'
import { isNil } from 'utils/isNil'
import { create } from 'zustand'

import { EVENTS } from 'constants/events'
import { ONE } from '../constants/common'

import { createSelectors } from './createSelectors'

interface State {
	eventTypes: Set<CirclesEventType>
	eventTypesAmount: Map<CirclesEventType, number>
	search: string | null
	startBlock: number
}

interface Action {
	updateEventTypes: (event: CirclesEventType) => void
	updateEventTypesBatch: (events: CirclesEventType[]) => void
	toggleAllEvents: () => void
	updateEventTypesAmount: (
		eventTypesAmount: Map<CirclesEventType, number>
	) => void
	updateSearch: (search: string) => void
	syncWithUrl: (parameters: {
		search?: string | null
		filter?: string | null
		startBlock?: string | null
		endBlock?: string | null
	}) => void
	updateStartBlock: (startBlock: number) => void
	clearStartBlock: () => void
}

const updateURLWithPush = (state: State) => {
	const url = new URL(window.location.href)

	if (state.search) {
		url.searchParams.set('search', state.search)
	} else {
		url.searchParams.delete('search')
	}

	window.history.pushState({}, '', url.toString())
}

const updateURL = (state: State) => {
	const url = new URL(window.location.href)

	if (state.eventTypes.size < EVENTS.length && state.eventTypes.size > 0) {
		url.searchParams.set('filter', [...state.eventTypes].join(','))
	} else {
		url.searchParams.delete('filter')
	}

	// Add block range to URL
	if (state.startBlock) {
		url.searchParams.set('startBlock', state.startBlock.toString())
	} else {
		url.searchParams.delete('startBlock')
	}

	window.history.replaceState({}, '', url.toString())
}

const useFilterStoreBase = create<Action & State>((set, get) => ({
	eventTypes: new Set(EVENTS),
	eventTypesAmount: new Map(),
	search: null,
	startBlock: 0,

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
	updateEventTypesAmount: (eventTypesAmount: Map<CirclesEventType, number>) =>
		set(() => ({ eventTypesAmount })),
	toggleAllEvents: () =>
		set((state) => {
			const newEventTypes =
				state.eventTypes.size === EVENTS.length
					? new Set<CirclesEventType>()
					: new Set(EVENTS)

			const newState = {
				...state,
				eventTypes: newEventTypes
			}

			updateURL(newState)
			return newState
		}),
	updateSearch: (search: string) => {
		set((state) => {
			// Clear start block when search changes
			state.clearStartBlock()
			const updatedState = get()

			const newState = {
				...updatedState,
				search,
				eventTypes: new Set(EVENTS)
			}

			updateURLWithPush(newState)
			return newState
		})
	},
	updateStartBlock: (startBlock: number) =>
		set((state) => {
			const newState = {
				...state,
				startBlock
			}
			updateURL(newState)
			return newState
		}),
	clearStartBlock: () => {
		set((state) => {
			const newState = {
				...state,
				startBlock: 0
			}
			updateURL(newState)
			return newState
		})
	},
	syncWithUrl: (parameters) => {
		if (!isNil(parameters.search)) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			get().updateSearch(parameters.search)
		}
		if (!isNil(parameters.filter)) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			const selectedEvents = parameters.filter.split(',') as CirclesEventType[]
			set({ eventTypes: new Set(selectedEvents) })
		}
		if (!isNil(parameters.startBlock)) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			const startBlock = Number.parseInt(parameters.startBlock, 10)
			if (!Number.isNaN(startBlock)) {
				set(() => ({
					startBlock
				}))
			}
		}
	}
}))

export const useFilterStore = createSelectors(useFilterStoreBase)
