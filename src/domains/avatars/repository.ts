import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { erc20Abi } from 'viem'

import tokenAbi from 'abis/tokenAbi.json'
import { MIGRATION_CONTRACT } from 'constants/common'
import { MILLISECONDS_IN_A_MINUTE } from 'constants/time'
import { circlesData } from 'services/circlesData'
import logger from 'services/logger'
import { viemClient } from 'services/viemClient'

import { CirclesQuery } from '@circles-sdk/data'
import {
	adaptAvatarFromSdk,
	adaptTokenFromSdk,
	createAvatarStats
} from './adapters'
import type { Avatar, AvatarStats, TokenInfo } from './types'

// Query keys
export const avatarKeys = {
	all: ['avatars'] as const,
	detail: (id: string) => [...avatarKeys.all, id] as const,
	stats: (id: string) => [...avatarKeys.detail(id), 'stats'] as const
}

// Repository methods
export const avatarRepository = {
	// Fetch avatar info
	getAvatar: async (address: Address): Promise<Avatar> => {
		try {
			const sdkAvatar = await circlesData.getAvatarInfo(address)
			if (!sdkAvatar) throw new Error('Avatar not found')

			return adaptAvatarFromSdk(sdkAvatar)
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
	},

	// Get token total supply
	getTokenTotalSupply: async (tokenAddress: Address): Promise<string> => {
		try {
			const totalSupplyBigInt = await viemClient.readContract({
				address: tokenAddress,
				abi: erc20Abi,
				functionName: 'totalSupply'
			})
			return totalSupplyBigInt.toString()
		} catch (error) {
			logger.error('[Repository] Failed to get token total supply:', error)
			return '0'
		}
	},

	// Check if token is stopped
	isTokenStopped: async (tokenAddress: Address): Promise<boolean> => {
		try {
			return (await viemClient.readContract({
				address: tokenAddress,
				abi: tokenAbi,
				functionName: 'stopped'
			})) as boolean
		} catch (error) {
			logger.error('[Repository] Failed to check if token is stopped:', error)
			return false
		}
	},

	// Get token migration amount
	getTokenMigrationAmount: async (
		tokenAddress: Address
	): Promise<number | undefined> => {
		try {
			const amount = await viemClient.readContract({
				address: tokenAddress,
				abi: erc20Abi,
				functionName: 'balanceOf',
				args: [MIGRATION_CONTRACT]
			})
			return Number(amount)
		} catch (error) {
			logger.error('[Repository] Failed to get token migration amount:', error)
			return undefined
		}
	},

	// Fetch token info
	getTokenInfo: async (
		tokenAddress: Address
	): Promise<{
		tokenInfo: TokenInfo | undefined
		migrationAmount?: number
	}> => {
		let tokenInfo
		let migrationAmount

		try {
			const sdkTokenInfo = await circlesData.getTokenInfo(tokenAddress)

			if (sdkTokenInfo) {
				// Get total supply and stopped status in parallel
				const [totalSupply, isStopped] = await Promise.all([
					avatarRepository.getTokenTotalSupply(tokenAddress),
					avatarRepository.isTokenStopped(tokenAddress)
				])

				tokenInfo = adaptTokenFromSdk(sdkTokenInfo, totalSupply, isStopped)

				// Get migration amount if it's a V1 token
				const VERSION_ONE = 1
				if (sdkTokenInfo.version === VERSION_ONE) {
					migrationAmount =
						await avatarRepository.getTokenMigrationAmount(tokenAddress)
				}
			}
		} catch (error) {
			logger.error('[Repository] Failed to fetch token info:', error)
		}

		return { tokenInfo, migrationAmount }
	},

	// Fetch avatar stats
	getAvatarStats: async (
		address: Address,
		existingAvatar?: Avatar
	): Promise<AvatarStats> => {
		// Use provided avatar or fetch it
		const avatar = existingAvatar ?? (await avatarRepository.getAvatar(address))

		// Prepare all fetch promises and results
		const promises = []
		// eslint-disable-next-line prefer-const
		let { invitedBy, tokenId } = avatar

		// Fetch invitedBy if not already present in the avatar
		if (!invitedBy) {
			promises.push(
				avatarRepository.getInvitedBy(address).then((result) => {
					invitedBy = result
				})
			)
		}

		// Initialize token data
		let v1Token: TokenInfo | undefined
		let v2Token: TokenInfo | undefined
		let v1MigrationAmount: number | undefined

		// V1 token info
		if (avatar.v1Token) {
			promises.push(
				avatarRepository
					.getTokenInfo(avatar.v1Token)
					.then(({ tokenInfo, migrationAmount }) => {
						v1Token = tokenInfo
						v1MigrationAmount = migrationAmount
					})
			)
		}

		// V2 token info
		if (tokenId) {
			promises.push(
				avatarRepository.getTokenInfo(tokenId).then(({ tokenInfo }) => {
					v2Token = tokenInfo
				})
			)
		}

		// Wait for all fetches to complete
		if (promises.length > 0) {
			await Promise.all(promises)
		}

		// Create a new avatar object with the updated invitedBy
		const updatedAvatar = {
			...avatar,
			invitedBy
		}

		return createAvatarStats(updatedAvatar, v1Token, v2Token, v1MigrationAmount)
	}
}

// React Query hooks
// Cache time constants
const AVATAR_CACHE_MINUTES = 5
const STATS_CACHE_MINUTES = 2

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

export const useAvatarStats = (address?: Address, avatar?: Avatar) =>
	useQuery({
		queryKey: address ? avatarKeys.stats(address) : avatarKeys.all,
		queryFn: async () => {
			if (!address) throw new Error('Address is required')
			return avatarRepository.getAvatarStats(address, avatar)
		},
		enabled: !!address,
		staleTime: STATS_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})
