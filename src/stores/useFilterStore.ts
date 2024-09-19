import { create } from 'zustand'
import type { Address } from 'viem'

import type { EventType } from 'types/events'

import { createSelectors } from './createSelectors'

interface State {
	search: Address | null
	eventsFilter: Set<EventType>
}

interface Action {
	updateSearch: (search: Address) => void
	updateEventsFilter: (event: EventType) => void
}

const useFilterStoreBase = create<Action & State>((set) => ({
	search: null,
	eventsFilter: new Set(),

	updateSearch: (search: Address) => set(() => ({ search })),
	updateEventsFilter: (event: EventType) =>
		set(({ eventsFilter }) => ({
			eventsFilter: eventsFilter.has(event)
				? new Set([...eventsFilter].filter((event_) => event_ !== event))
				: new Set([...eventsFilter, event])
		}))
}))

export const useFilterStore = createSelectors(useFilterStoreBase)
