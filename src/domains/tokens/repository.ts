import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { erc20Abi, formatUnits } from 'viem'

import tokenAbi from 'abis/tokenAbi.json'
import {
	CRC_TOKEN_DECIMALS,
	MIGRATION_CONTRACT,
	ONE,
	PERCENTAGE_DIVIDER
} from 'constants/common'
import { MILLISECONDS_IN_A_MINUTE } from 'constants/time'
import { circlesData } from 'services/circlesData'
import { circlesRpc } from 'services/circlesRpc'
import logger from 'services/logger'
import { viemClient } from 'services/viemClient'

import type { EventRow, TokenBalanceRow } from '@circles-sdk/data'
import { CirclesQuery } from '@circles-sdk/data'
import type { Avatar } from 'domains/avatars/types'
import { fetchCrcV2TotalSupply } from 'services/circlesIndex'
import {
	adaptTokenFromSdk,
	createTokenBalance,
	formatTokenMigrationAmount
} from './adapters'
import type { Token, TokenBalance, TokenHolder } from './types'

const VERSION_ONE = 1
const VERSION_TWO = 2

const DEFAULT_HOLDERS_LIMIT = 1000

// Query keys
export const tokenKeys = {
	all: ['tokens'] as const,
	detail: (id: string) => [...tokenKeys.all, id] as const,
	balance: (id: string, owner: string) =>
		[...tokenKeys.detail(id), 'balance', owner] as const,
	migration: (id: string) => [...tokenKeys.detail(id), 'migration'] as const,
	holders: (id: string) => [...tokenKeys.detail(id), 'holders'] as const
}

// Repository methods
export const tokenRepository = {
	// Get total balance (V1)
	getTotalBalance: async (address: Address): Promise<string> => {
		try {
			return await circlesData.getTotalBalance(address)
		} catch (error) {
			logger.error('[Repository] Failed to get total balance:', error)
			return '0'
		}
	},

	// Get total balance (V2)
	getTotalBalanceV2: async (address: Address): Promise<string> => {
		try {
			return await circlesData.getTotalBalanceV2(address)
		} catch (error) {
			logger.error('[Repository] Failed to get total balance V2:', error)
			return '0'
		}
	},

	// Get token balances
	getTokenBalances: async (address: Address): Promise<TokenBalanceRow[]> => {
		try {
			return await circlesData.getTokenBalances(address)
		} catch (error) {
			logger.error('[Repository] Failed to get token balances:', error)
			return []
		}
	},

	// Check if V1 token is stopped
	isV1TokenStopped: async (tokenAddress: Address): Promise<boolean> => {
		try {
			return (await viemClient.readContract({
				address: tokenAddress,
				abi: tokenAbi,
				functionName: 'stopped'
			})) as boolean
		} catch (error) {
			logger.error(
				'[Repository] Failed to check if V1 token is stopped:',
				error
			)
			return false
		}
	},

	// Check if V2 token is stopped
	isV2TokenStopped: async (address: Address): Promise<boolean> => {
		try {
			const query = new CirclesQuery<EventRow & { avatar: Address }>(
				circlesData.rpc,
				{
					namespace: 'CrcV2',
					table: 'Stopped',
					columns: ['avatar'],
					filter: [
						{
							Type: 'Conjunction',
							ConjunctionType: 'Or',
							Predicates: [
								{
									Type: 'FilterPredicate',
									FilterType: 'Equals',
									Column: 'avatar',
									Value: address.toLowerCase()
								}
							]
						}
					],
					sortOrder: 'DESC',
					limit: ONE
				}
			)

			const hasResults = await query.queryNextPage()
			return hasResults && (query.currentPage?.results.length ?? 0) > 0
		} catch (error) {
			logger.error(
				'[Repository] Failed to check if V2 token is stopped:',
				error
			)
			return false
		}
	},

	// Fetch token info
	getToken: async (
		address: Address,
		version: number
	): Promise<Token | undefined> => {
		try {
			// Fetch token info from SDK
			const tokenInfoPromise = circlesData.getTokenInfo(address)
			const tokenInfo = await tokenInfoPromise

			if (!tokenInfo) return undefined

			// Prepare promises for concurrent execution
			const promises = {
				// Get total supply based on version
				totalSupply: (async () => {
					try {
						if (version === VERSION_ONE) {
							const result = await viemClient.readContract({
								address,
								abi: erc20Abi,
								functionName: 'totalSupply'
							})
							return result.toString()
						}
						if (version === VERSION_TWO) {
							const result = await fetchCrcV2TotalSupply(address)
							// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-condition
							return result?.totalSupply ?? '0'
						}
						return '0'
					} catch (error) {
						logger.error(
							'[Repository] Failed to get token total supply:',
							error
						)
						return '0'
					}
				})(),

				// Check if token is stopped based on version
				isStopped: (async () => {
					try {
						return version === VERSION_ONE
							? await tokenRepository.isV1TokenStopped(address)
							: await tokenRepository.isV2TokenStopped(address)
					} catch (error) {
						logger.error(
							'[Repository] Failed to check if token is stopped:',
							error
						)
						return false
					}
				})()
			}

			// Execute promises concurrently
			const [totalSupply, isStopped] = await Promise.all([
				promises.totalSupply,
				promises.isStopped
			])

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
	getTokenMigration: async (token?: Token): Promise<string | undefined> => {
		try {
			if (!token) return undefined

			// Get migration amount
			const migrationAmount = await viemClient.readContract({
				address: token.address,
				abi: erc20Abi,
				functionName: 'balanceOf',
				args: [MIGRATION_CONTRACT]
			})

			return formatTokenMigrationAmount(Number(migrationAmount))
		} catch (error) {
			logger.error('[Repository] Failed to fetch token migration:', error)
			return undefined
		}
	},

	// Get token data for avatar
	getTokenDataForAvatar: async (
		avatar: Avatar
	): Promise<{
		v1Token?: Token
		v2Token?: Token
		v1MigrationAmount?: string
	}> => {
		const result: {
			v1Token?: Token
			v2Token?: Token
			v1MigrationAmount?: string
		} = {}

		// Prepare all promises in an array
		const allPromises = []

		// V1 token info
		if (avatar.v1Token) {
			allPromises.push(
				tokenRepository
					.getToken(avatar.v1Token, VERSION_ONE)
					.then((tokenInfo) => {
						result.v1Token = tokenInfo
					})
			)
		}

		// V2 token info
		if (avatar.tokenId) {
			allPromises.push(
				tokenRepository
					.getToken(avatar.tokenId, VERSION_TWO)
					.then((tokenInfo) => {
						result.v2Token = tokenInfo
					})
			)
		}

		// Wait for all fetches to complete
		await Promise.all(allPromises)

		// V1 migration data
		if (result.v1Token) {
			await tokenRepository
				.getTokenMigration(result.v1Token)
				.then((v1MigrationAmount) => {
					result.v1MigrationAmount = v1MigrationAmount
				})
		}

		return result
	},

	// Get holders for a CRC V2 token using circles_query
	getTokenHoldersV2: async (
		tokenAddress: Address,
		limit = DEFAULT_HOLDERS_LIMIT
	): Promise<TokenHolder[]> => {
		try {
			interface RpcTabularResult {
				columns: string[]
				rows: (number | string)[][]
			}

			const queryPayload = {
				Namespace: 'V_CrcV2',
				Table: 'BalancesByAccountAndToken',
				Columns: [] as string[],
				Filter: [
					{
						Type: 'FilterPredicate',
						FilterType: 'Equals',
						Column: 'tokenAddress',
						Value: tokenAddress.toLowerCase()
					}
				],
				Order: [
					{
						Column: 'demurragedTotalBalance',
						SortOrder: 'DESC'
					}
				],
				Limit: limit
			}

			const result =
				await circlesRpc.circlesQuery<RpcTabularResult>(queryPayload)

			const index = (name: string) => result.columns.indexOf(name)

			const indexAccount = index('account')
			const indexTokenId = index('tokenId')
			const indexTokenAddress = index('tokenAddress')
			const indexLastActivity = index('lastActivity')
			const indexTotal = index('totalBalance')
			const indexDemTotal = index('demurragedTotalBalance')

			if (
				indexAccount < 0 ||
				indexTokenId < 0 ||
				indexTokenAddress < 0 ||
				indexLastActivity < 0 ||
				indexTotal < 0 ||
				indexDemTotal < 0
			) {
				logger.error(
					'[Repository] Unexpected columns from circles_query BalancesByAccountAndToken:',
					result.columns
				)
				return []
			}

			const holders: TokenHolder[] = result.rows.map((row) => {
				const account = String(row[indexAccount]) as Address
				const tokenId = String(row[indexTokenId]) as Address
				const tAddress = String(row[indexTokenAddress]) as Address
				const lastActivity = Number(row[indexLastActivity])
				const totalBalance = String(row[indexTotal])
				const demurragedTotalBalance = String(row[indexDemTotal])

				const circlesTotal = Number(
					formatUnits(BigInt(totalBalance || '0'), CRC_TOKEN_DECIMALS)
				)
				const circlesDemurraged = Number(
					formatUnits(BigInt(demurragedTotalBalance || '0'), CRC_TOKEN_DECIMALS)
				)

				return {
					account,
					tokenId,
					tokenAddress: tAddress,
					lastActivity,
					totalBalance,
					demurragedTotalBalance,
					circlesDemurraged,
					circlesTotal
				}
			})

			return holders
		} catch (error) {
			logger.error('[Repository] Failed to fetch token holders V2:', error)
			return []
		}
	},

	// Get holders for a CRC V1 token using circles_query
	getTokenHoldersV1: async (
		tokenAddress: Address,
		limit = DEFAULT_HOLDERS_LIMIT
	): Promise<TokenHolder[]> => {
		try {
			interface RpcTabularResult {
				columns: string[]
				rows: (number | string)[][]
			}

			const queryPayload = {
				Namespace: 'V_CrcV1',
				Table: 'BalancesByAccountAndToken',
				Columns: [] as string[],
				Filter: [
					{
						Type: 'FilterPredicate',
						FilterType: 'Equals',
						Column: 'tokenAddress',
						Value: tokenAddress.toLowerCase()
					}
				],
				Order: [
					{
						Column: 'totalBalance',
						SortOrder: 'DESC'
					}
				],
				Limit: limit
			}

			const result =
				await circlesRpc.circlesQuery<RpcTabularResult>(queryPayload)

			const index = (name: string) => result.columns.indexOf(name)

			const indexAccount = index('account')
			const indexTokenAddress = index('tokenAddress')
			const indexLastActivity = index('lastActivity')
			const indexTotal = index('totalBalance')

			if (
				indexAccount < 0 ||
				indexTokenAddress < 0 ||
				indexLastActivity < 0 ||
				indexTotal < 0
			) {
				logger.error(
					'[Repository] Unexpected columns from circles_query BalancesByAccountAndToken (V1):',
					result.columns
				)
				return []
			}

			const holders: TokenHolder[] = result.rows.map((row) => {
				const account = String(row[indexAccount]) as Address
				const tAddress = String(row[indexTokenAddress]) as Address
				const lastActivity = Number(row[indexLastActivity])
				const totalBalance = String(row[indexTotal])

				// V1 has no demurrage; treat demurraged = total
				const demurragedTotalBalance = totalBalance

				const circlesTotal = Number(
					formatUnits(BigInt(totalBalance || '0'), CRC_TOKEN_DECIMALS)
				)
				const circlesDemurraged = circlesTotal

				return {
					account,
					tokenId: tAddress,
					tokenAddress: tAddress,
					lastActivity,
					totalBalance,
					demurragedTotalBalance,
					circlesDemurraged,
					circlesTotal
				}
			})

			return holders
		} catch (error) {
			logger.error('[Repository] Failed to fetch token holders V1:', error)
			return []
		}
	}
}

// Cache time constants
const TOKEN_CACHE_MINUTES = 5

export const useToken = (address?: Address, version = VERSION_ONE) =>
	useQuery({
		queryKey: address ? [...tokenKeys.detail(address), version] : tokenKeys.all,
		queryFn: async () => {
			if (!address) throw new Error('Token address is required')
			return tokenRepository.getToken(address, version)
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

export const useTokenMigration = (token?: Token) =>
	useQuery({
		queryKey: token ? tokenKeys.migration(token.address) : tokenKeys.all,
		queryFn: async () => {
			if (!token) throw new Error('Token address is required')
			return tokenRepository.getTokenMigration(token)
		},
		enabled: !!token,
		staleTime: TOKEN_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})

export const useTokenHoldersV1 = (
	tokenAddress?: Address,
	limit = DEFAULT_HOLDERS_LIMIT
) =>
	useQuery({
		queryKey: tokenAddress ? tokenKeys.holders(tokenAddress) : tokenKeys.all,
		queryFn: async () => {
			if (!tokenAddress) throw new Error('Token address is required')
			const holders = await tokenRepository.getTokenHoldersV1(
				tokenAddress,
				limit
			)
			const totalDem = holders.reduce(
				(sum, h) => sum + (h.circlesDemurraged || 0),
				0
			)
			// derive share percent
			return holders.map((h) => ({
				...h,
				sharePercent:
					totalDem > 0
						? (h.circlesDemurraged / totalDem) * PERCENTAGE_DIVIDER
						: 0
			}))
		},
		enabled: !!tokenAddress,
		staleTime: TOKEN_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})

export const useTokenHoldersV2 = (
	tokenAddress?: Address,
	limit = DEFAULT_HOLDERS_LIMIT
) =>
	useQuery({
		queryKey: tokenAddress ? tokenKeys.holders(tokenAddress) : tokenKeys.all,
		queryFn: async () => {
			if (!tokenAddress) throw new Error('Token address is required')
			const holders = await tokenRepository.getTokenHoldersV2(
				tokenAddress,
				limit
			)
			const totalDem = holders.reduce(
				(sum, h) => sum + (h.circlesDemurraged || 0),
				0
			)
			// derive share percent
			return holders.map((h) => ({
				...h,
				sharePercent:
					totalDem > 0
						? (h.circlesDemurraged / totalDem) * PERCENTAGE_DIVIDER
						: 0
			}))
		},
		enabled: !!tokenAddress,
		staleTime: TOKEN_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})

// Hook for avatar token data
export const useAvatarTokenData = (avatar?: Avatar) =>
	useQuery({
		queryKey: avatar
			? ['avatarTokenData', avatar.address]
			: ['avatarTokenData'],
		queryFn: async () => {
			if (!avatar) throw new Error('Avatar is required')
			return tokenRepository.getTokenDataForAvatar(avatar)
		},
		enabled: !!avatar,
		staleTime: TOKEN_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})
