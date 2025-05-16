import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'

import { MILLISECONDS_IN_A_MINUTE } from 'constants/time'
import { circlesData } from 'services/circlesData'
import logger from 'services/logger'

import { CirclesQuery } from '@circles-sdk/data'
import { adaptAvatarFromSdk } from './adapters'
import type { Avatar } from './types'

// Query keys
export const avatarKeys = {
	all: ['avatars'] as const,
	detail: (id: string) => [...avatarKeys.all, id] as const,
	stats: (id: string) => [...avatarKeys.detail(id), 'stats'] as const
}

// Repository methods
export const avatarRepository = {
	// Fetch avatar info with invitedBy
	getAvatar: async (address: Address): Promise<Avatar> => {
		try {
			// Fetch avatar info and invitedBy in parallel
			const [avatarInfo, invitedBy] = await Promise.all([
				circlesData.getAvatarInfo(address),
				avatarRepository.getInvitedBy(address)
			])

			if (!avatarInfo) throw new Error('Avatar not found')

			// Create avatar with invitedBy information
			const avatar = adaptAvatarFromSdk(avatarInfo)
			return {
				...avatar,
				invitedBy
			}
		} catch (error) {
			logger.error('[Repository] Failed to fetch avatar:', error)
			throw new Error('Failed to fetch avatar')
		}
	},

	// Fetch invited by information
	getInvitedBy: async (address: Address): Promise<Address | undefined> => {
		try {
			const LIMIT_ONE = 1
			// todo: it'll be changed to circlesData.getInvitedBy after sdk fix
			const query = new CirclesQuery<{
				blockNumber: number
				timestamp: number
				transactionIndex: number
				logIndex: number
				transactionHash: string
				avatar: Address
				inviter: Address
			}>(circlesData.rpc, {
				namespace: 'CrcV2',
				table: 'RegisterHuman',
				columns: [
					'blockNumber',
					'timestamp',
					'transactionIndex',
					'logIndex',
					'transactionHash',
					'avatar',
					'inviter'
				],
				filter: [
					{
						Type: 'FilterPredicate',
						FilterType: 'Equals',
						Column: 'avatar',
						Value: address.toLowerCase()
					}
				],
				sortOrder: 'DESC',
				limit: LIMIT_ONE
			})

			const hasResults = await query.queryNextPage()
			if (!hasResults || !query.currentPage?.results.length) {
				return undefined
			}

			return query.currentPage.results[0].inviter
		} catch (error) {
			logger.error('[Repository] Failed to fetch invited by:', error)
			return undefined
		}
	}
}

// React Query hooks
// Cache time constants
const AVATAR_CACHE_MINUTES = 5

export const useAvatar = (address?: Address) =>
	useQuery({
		queryKey: address ? avatarKeys.detail(address) : avatarKeys.all,
		queryFn: async () => {
			if (!address) throw new Error('Address is required')
			return avatarRepository.getAvatar(address)
		},
		enabled: !!address,
		staleTime: AVATAR_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})
