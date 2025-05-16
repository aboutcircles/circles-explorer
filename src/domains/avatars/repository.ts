import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'

import { MILLISECONDS_IN_A_MINUTE } from 'constants/time'
import { circlesData } from 'services/circlesData'
import logger from 'services/logger'

import { CirclesQuery } from '@circles-sdk/data'
import { DEAD_ADDRESS } from 'constants/common'
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
	// Fetch avatar info with invitedBy and lastMint
	getAvatar: async (address: Address): Promise<Avatar> => {
		try {
			// Fetch avatar info, invitedBy, and lastMint in parallel
			const [avatarInfo, invitedBy, lastMint] = await Promise.all([
				circlesData.getAvatarInfo(address),
				avatarRepository.getInvitedBy(address),
				avatarRepository.getLastMint(address)
			])

			if (!avatarInfo) throw new Error('Avatar not found')

			// Create avatar with invitedBy and lastMint information
			const avatar = adaptAvatarFromSdk(avatarInfo)
			return {
				...avatar,
				invitedBy,
				lastMint: lastMint ?? avatar.lastMint // Use the fetched lastMint if available, otherwise fall back to the creation timestamp
			}
		} catch (error) {
			logger.error('[Repository] Failed to fetch avatar:', error)
			throw new Error('Failed to fetch avatar')
		}
	},

	// Fetch last mint timestamp for V1 tokens
	getLastMintV1: async (address: Address): Promise<number | undefined> => {
		try {
			const LIMIT_ONE = 1
			const query = new CirclesQuery<{
				blockNumber: number
				timestamp: number
				transactionIndex: number
				logIndex: number
				transactionHash: string
				tokenAddress: Address
				from: Address
				to: Address
				amount: string
			}>(circlesData.rpc, {
				namespace: 'CrcV1',
				table: 'Transfer',
				columns: [
					'blockNumber',
					'timestamp',
					'transactionIndex',
					'logIndex',
					'transactionHash',
					'tokenAddress',
					'from',
					'to',
					'amount'
				],
				filter: [
					{
						Type: 'Conjunction',
						ConjunctionType: 'And',
						Predicates: [
							{
								Type: 'FilterPredicate',
								FilterType: 'Equals',
								Column: 'from',
								Value: DEAD_ADDRESS
							},
							{
								Type: 'FilterPredicate',
								FilterType: 'Equals',
								Column: 'to',
								Value: address.toLowerCase()
							}
						]
					}
				],
				sortOrder: 'DESC',
				limit: LIMIT_ONE
			})

			const hasResults = await query.queryNextPage()
			if (!hasResults || !query.currentPage?.results.length) {
				return undefined
			}

			return query.currentPage.results[0].timestamp
		} catch (error) {
			logger.error('[Repository] Failed to fetch V1 last mint:', error)
			return undefined
		}
	},

	// Fetch last mint timestamp for V2 tokens
	getLastMintV2: async (address: Address): Promise<number | undefined> => {
		try {
			const LIMIT_ONE = 1
			const query = new CirclesQuery<{
				blockNumber: number
				timestamp: number
				transactionIndex: number
				logIndex: number
				transactionHash: string
				human: Address
				amount: string
				startPeriod: number
				endPeriod: number
			}>(circlesData.rpc, {
				namespace: 'CrcV2',
				table: 'PersonalMint',
				columns: [
					'blockNumber',
					'timestamp',
					'transactionIndex',
					'logIndex',
					'transactionHash',
					'human',
					'amount',
					'startPeriod',
					'endPeriod'
				],
				filter: [
					{
						Type: 'FilterPredicate',
						FilterType: 'Equals',
						Column: 'human',
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

			return query.currentPage.results[0].timestamp
		} catch (error) {
			logger.error('[Repository] Failed to fetch V2 last mint:', error)
			return undefined
		}
	},

	// Combined function to fetch the most recent mint timestamp
	getLastMint: async (address: Address): Promise<number | undefined> => {
		try {
			// Fetch both V1 and V2 last mint timestamps in parallel
			const [lastMintV1, lastMintV2] = await Promise.all([
				avatarRepository.getLastMintV1(address),
				avatarRepository.getLastMintV2(address)
			])

			// If both are undefined, return undefined
			if (lastMintV1 === undefined && lastMintV2 === undefined) {
				return undefined
			}

			// If one is undefined, return the other
			if (lastMintV1 === undefined) return lastMintV2
			if (lastMintV2 === undefined) return lastMintV1

			// Return the most recent timestamp
			return Math.max(lastMintV1, lastMintV2)
		} catch (error) {
			logger.error('[Repository] Failed to fetch last mint:', error)
			return undefined
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
