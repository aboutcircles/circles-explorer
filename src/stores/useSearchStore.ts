import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

import { createSelectors } from './createSelectors'

interface State {
	search: string | null
}

interface Action {
	updateSearch: (search: string) => void
}

const useSearchStoreBase = create<Action & State>()(
	subscribeWithSelector((set) => ({
		search: null,

		updateSearch: (search: string) => set(() => ({ search }))
	}))
)

export const useSearchStore = createSelectors(useSearchStoreBase)
