import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { erc20Abi } from 'viem'

import { MIGRATION_CONTRACT } from 'constants/common'
import { circlesData } from 'services/circlesData'
import { viemClient } from 'services/viemClient'
import { MILLISECONDS_IN_A_MINUTE } from 'constants/time'
import tokenAbi from 'abis/tokenAbi.json'
import logger from 'services/logger'

import {
	adaptAvatarFromSdk,
	adaptTokenFromSdk,
	createAvatarStats
} from './adapters'
import type { Avatar, AvatarStats } from './types'

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

			// Get invited by information if available
			let invitedBy: Address | undefined
			try {
				invitedBy = await circlesData.getInvitedBy(address)
			} catch (error) {
				logger.error('[Repository] Failed to fetch invited by:', error)
			}

			const avatar = adaptAvatarFromSdk(sdkAvatar)

			return {
				...avatar,
				invitedBy
			}
		} catch (error) {
			logger.error('[Repository] Failed to fetch avatar:', error)
			throw new Error('Failed to fetch avatar')
		}
	},

	// Fetch avatar stats
	getAvatarStats: async (address: Address): Promise<AvatarStats> => {
		const avatar = await avatarRepository.getAvatar(address)

		// Get V1 token info
		let v1Token
		let v1MigrationAmount

		if (avatar.v1Token) {
			try {
				const tokenInfo = await circlesData.getTokenInfo(avatar.v1Token)

				// Get total supply
				let totalSupply = '0'
				try {
					// Try to get total supply from the token contract
					const totalSupplyBigInt = await viemClient.readContract({
						address: avatar.v1Token,
						abi: erc20Abi,
						functionName: 'totalSupply'
					})
					totalSupply = totalSupplyBigInt.toString()
				} catch (error) {
					logger.error(
						'[Repository] Failed to get V1 token total supply:',
						error
					)
				}

				// Check if token is stopped
				let isStopped = false
				try {
					isStopped = (await viemClient.readContract({
						address: avatar.v1Token,
						abi: tokenAbi,
						functionName: 'stopped'
					})) as boolean
				} catch (error) {
					logger.error(
						'[Repository] Failed to check if V1 token is stopped:',
						error
					)
				}

				if (tokenInfo) {
					v1Token = adaptTokenFromSdk(tokenInfo, totalSupply, isStopped)
				}

				// Get migration amount
				try {
					v1MigrationAmount = Number(
						await viemClient.readContract({
							address: avatar.v1Token,
							abi: erc20Abi,
							functionName: 'balanceOf',
							args: [MIGRATION_CONTRACT]
						})
					)
				} catch (error) {
					logger.error(
						'[Repository] Failed to get V1 token migration amount:',
						error
					)
				}
			} catch (error) {
				logger.error('[Repository] Failed to fetch V1 token info:', error)
			}
		}

		// Get V2 token info
		let v2Token

		if (avatar.tokenId) {
			try {
				const tokenInfo = await circlesData.getTokenInfo(avatar.tokenId)

				// Get total supply
				let totalSupply = '0'
				try {
					// Try to get total supply from the token contract
					const totalSupplyBigInt = await viemClient.readContract({
						address: avatar.tokenId,
						abi: erc20Abi,
						functionName: 'totalSupply'
					})
					totalSupply = totalSupplyBigInt.toString()
				} catch (error) {
					logger.error(
						'[Repository] Failed to get V2 token total supply:',
						error
					)
				}

				// Check if token is stopped (implementation would depend on how V2 tokens are stopped)
				const isStopped = false
				// For V2, we might need a different approach to check if token is stopped

				if (tokenInfo) {
					v2Token = adaptTokenFromSdk(tokenInfo, totalSupply, isStopped)
				}
			} catch (error) {
				logger.error('[Repository] Failed to fetch V2 token info:', error)
			}
		}

		return createAvatarStats(avatar, v1Token, v2Token, v1MigrationAmount)
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

export const useAvatarStats = (address?: Address) =>
	useQuery({
		queryKey: address ? avatarKeys.stats(address) : avatarKeys.all,
		queryFn: async () => {
			if (!address) throw new Error('Address is required')
			return avatarRepository.getAvatarStats(address)
		},
		enabled: !!address,
		staleTime: STATS_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})
