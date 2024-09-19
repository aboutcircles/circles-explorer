import { create } from 'zustand'
import type { Address } from 'viem'

import type { EventType } from 'types/events'
import { EVENTS } from 'constants/events'

import { createSelectors } from './createSelectors'

interface State {
	search: Address | null
	eventTypes: Set<EventType>
}

interface Action {
	updateSearch: (search: Address) => void
	updateEventTypes: (event: EventType) => void
}

const useFilterStoreBase = create<Action & State>((set) => ({
	search: null,
	eventTypes: new Set(EVENTS),

	updateSearch: (search: Address) => set(() => ({ search })),
	updateEventTypes: (event: EventType) =>
		set(({ eventTypes }) => ({
			eventTypes: eventTypes.has(event)
				? new Set([...eventTypes].filter((event_) => event_ !== event))
				: new Set([...eventTypes, event])
		}))
}))

export const useFilterStore = createSelectors(useFilterStoreBase)
