import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { erc20Abi } from 'viem'

import { MILLISECONDS_IN_A_MINUTE } from 'constants/time'
import { MIGRATION_CONTRACT } from 'constants/common'
import { circlesData } from 'services/circlesData'
import { viemClient } from 'services/viemClient'
import logger from 'services/logger'

import {
	adaptTokenFromSdk,
	createTokenBalance,
	createTokenMigration
} from './adapters'
import type { Token, TokenBalance, TokenMigration } from './types'

// Query keys
export const tokenKeys = {
	all: ['tokens'] as const,
	detail: (id: string) => [...tokenKeys.all, id] as const,
	balance: (id: string, owner: string) =>
		[...tokenKeys.detail(id), 'balance', owner] as const,
	migration: (id: string) => [...tokenKeys.detail(id), 'migration'] as const
}

// Repository methods
export const tokenRepository = {
	// Fetch token info
	getToken: async (address: Address): Promise<Token | undefined> => {
		try {
			const tokenInfo = await circlesData.getTokenInfo(address)
			if (!tokenInfo) return undefined

			// Get total supply
			let totalSupply = '0'
			try {
				const totalSupplyBigInt = await viemClient.readContract({
					address,
					abi: erc20Abi,
					functionName: 'totalSupply'
				})
				totalSupply = totalSupplyBigInt.toString()
			} catch (error) {
				logger.error('[Repository] Failed to get token total supply:', error)
			}

			// Check if token is stopped
			const isStopped = false
			// This would depend on the token type and version
			// For now, we'll assume it's not stopped

			return adaptTokenFromSdk(tokenInfo, totalSupply, isStopped)
		} catch (error) {
			logger.error('[Repository] Failed to fetch token info:', error)
			return undefined
		}
	},

	// Fetch token balance
	getTokenBalance: async (
		tokenAddress: Address,
		ownerAddress: Address
	): Promise<TokenBalance | undefined> => {
		try {
			// Get balance from contract
			const balance = await viemClient.readContract({
				address: tokenAddress,
				abi: erc20Abi,
				functionName: 'balanceOf',
				args: [ownerAddress]
			})

			return createTokenBalance(
				tokenAddress,
				ownerAddress,
				balance.toString(),
				Date.now()
			)
		} catch (error) {
			logger.error('[Repository] Failed to fetch token balance:', error)
			return undefined
		}
	},

	// Fetch token migration info
	getTokenMigration: async (
		tokenAddress: Address
	): Promise<TokenMigration | undefined> => {
		try {
			// Get token info for total supply
			const token = await tokenRepository.getToken(tokenAddress)
			if (!token) return undefined

			// Get migration amount
			const migrationAmount = await viemClient.readContract({
				address: tokenAddress,
				abi: erc20Abi,
				functionName: 'balanceOf',
				args: [MIGRATION_CONTRACT]
			})

			return createTokenMigration(
				tokenAddress,
				Number(migrationAmount),
				token.totalSupply
			)
		} catch (error) {
			logger.error('[Repository] Failed to fetch token migration:', error)
			return undefined
		}
	}
}

// Cache time constants
const TOKEN_CACHE_MINUTES = 5

// React Query hooks
export const useToken = (address?: Address) =>
	useQuery({
		queryKey: address ? tokenKeys.detail(address) : tokenKeys.all,
		queryFn: async () => {
			if (!address) throw new Error('Token address is required')
			return tokenRepository.getToken(address)
		},
		enabled: !!address,
		staleTime: TOKEN_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})

export const useTokenBalance = (
	tokenAddress?: Address,
	ownerAddress?: Address
) =>
	useQuery({
		queryKey:
			tokenAddress && ownerAddress
				? tokenKeys.balance(tokenAddress, ownerAddress)
				: tokenKeys.all,
		queryFn: async () => {
			if (!tokenAddress) throw new Error('Token address is required')
			if (!ownerAddress) throw new Error('Owner address is required')
			return tokenRepository.getTokenBalance(tokenAddress, ownerAddress)
		},
		enabled: !!tokenAddress && !!ownerAddress,
		staleTime: TOKEN_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})

export const useTokenMigration = (address?: Address) =>
	useQuery({
		queryKey: address ? tokenKeys.migration(address) : tokenKeys.all,
		queryFn: async () => {
			if (!address) throw new Error('Token address is required')
			return tokenRepository.getTokenMigration(address)
		},
		enabled: !!address,
		staleTime: TOKEN_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})
