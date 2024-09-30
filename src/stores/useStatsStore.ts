import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { StatsResult } from 'types/stats'

import { createSelectors } from './createSelectors'

interface State {
	avatarCountV1: number
	organizationCountV1: number
	humanCountV1: number
	avatarCountV2: number
	organizationCountV2: number
	humanCountV2: number
	groupCountV2: number
	trustCountV1: number
	trustCountV2: number
	tokenCountV1: number
	tokenCountV2: number
	transitiveTransferCountV1: number
	transitiveTransferCountV2: number
	circlesTransferCountV1: number
	circlesTransferCountV2: number
	erc20WrapperTokenCountV2: number

	isLoading: boolean

	_hasHydrated: boolean
}

interface Action {
	setStats: (stats: StatsResult) => void

	setHasHydrated: (state: boolean) => void
}

const measureNameMapper = {
	avatar_count_v1: 'avatarCountV1',
	organization_count_v1: 'organizationCountV1',
	human_count_v1: 'humanCountV1',
	avatar_count_v2: 'avatarCountV2',
	organization_count_v2: 'organizationCountV2',
	human_count_v2: 'humanCountV2',
	group_count_v2: 'groupCountV2',
	trust_count_v1: 'trustCountV1',
	trust_count_v2: 'trustCountV2',
	token_count_v1: 'tokenCountV1',
	token_count_v2: 'tokenCountV2',
	transitive_transfer_count_v1: 'transitiveTransferCountV1',
	transitive_transfer_count_v2: 'transitiveTransferCountV2',
	circles_transfer_count_v1: 'circlesTransferCountV1',
	circles_transfer_count_v2: 'circlesTransferCountV2',
	erc20_wrapper_token_count_v2: 'erc20WrapperTokenCountV2'
}

const useRecordsStoreBase = create<Action & State>()(
	persist(
		(set) => ({
			avatarCountV1: 0,
			organizationCountV1: 0,
			humanCountV1: 0,
			avatarCountV2: 0,
			organizationCountV2: 0,
			humanCountV2: 0,
			groupCountV2: 0,
			trustCountV1: 0,
			trustCountV2: 0,
			tokenCountV1: 0,
			tokenCountV2: 0,
			transitiveTransferCountV1: 0,
			transitiveTransferCountV2: 0,
			circlesTransferCountV1: 0,
			circlesTransferCountV2: 0,
			erc20WrapperTokenCountV2: 0,

			isLoading: true,

			_hasHydrated: false,
			setHasHydrated: (state) => set({ _hasHydrated: state }),

			setStats: (stats) => {
				// eslint-disable-next-line unicorn/no-array-reduce
				const statsMap = stats.rows.reduce<Record<string, number>>(
					(accumulator, [measure, value]) => {
						accumulator[measureNameMapper[measure]] = Number(value)

						return accumulator
					},
					{}
				)

				set({
					...statsMap,
					isLoading: false
				})
			}
		}),
		{
			name: 'stats-storage',

			onRehydrateStorage: () => {
				console.log('hydration starts')

				return (state, error) => {
					if (error) {
						console.log('an error happened during hydration', error)
					} else {
						state?.setHasHydrated(true)

						console.log('hydration finished')
					}
				}
			}
		}
	)
)

export const useStatsStore = createSelectors(useRecordsStoreBase)
