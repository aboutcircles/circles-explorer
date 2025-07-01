import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'

import { DEFAULT_BATCH_SIZE, MIN_BATCH_SIZE, ONE } from 'constants/common'
import { MILLISECONDS_IN_A_MINUTE } from 'constants/time'
import { circlesRpc, type RpcProfile } from 'services/circlesRpc'
import logger from 'services/logger'

import { adaptNullableProfileFromRpc, adaptProfileFromRpc } from './adapters'
import type { Profile } from './types'

/*
todo:
- react query for profiles
- remove envio and fallback relation at all (later, after check on dev)
 */

// Query keys
export const profileKeys = {
	all: ['profiles'] as const,
	detail: (id: string) => [...profileKeys.all, id] as const,
	list: (ids: string[]) =>
		[...profileKeys.all, 'list', ids.sort().join(',')] as const,
	search: (query: string) => [...profileKeys.all, 'search', query] as const
}

// Constants
const MAX_SEARCH_OFFSET = 10_000
const RPC_SEARCH_LIMIT = 100
const CHUNK_NUMBER_OFFSET = 1

/**
 * Extract batch size limit from RPC error message and return adjusted batch size
 * Error format: "Batch size exceeds 100 (Parameter 'avatars')"
 * Returns the new batch size limit or null if not a batch size error
 */
const getBatchSizeFromError = (errorMessage: string): number | null => {
	const match = errorMessage.match(/Batch size exceeds (\d+)/)
	return match
		? Math.max(Number.parseInt(match[ONE], 10), MIN_BATCH_SIZE)
		: null
}

// Repository methods
export const profileRepository = {
	// Get multiple profiles with optional batch size parameter
	getProfiles: async (
		addresses: Address[],
		batchSize: number = DEFAULT_BATCH_SIZE
	): Promise<Record<string, Profile | null>> => {
		try {
			if (addresses.length === 0) return {}

			// Split addresses into chunks to respect batch size limit
			const chunks: string[][] = []
			for (let index = 0; index < addresses.length; index += batchSize) {
				chunks.push(addresses.slice(index, index + batchSize))
			}

			logger.log(
				`[Repository] Fetching ${addresses.length} profiles in ${chunks.length} chunks (batch size: ${batchSize})`
			)

			// Try batch RPC request first, fallback to Promise.all if batch fails
			let chunkResults: {
				chunk: string[]
				profiles: (RpcProfile | null)[]
				chunkIndex: number
			}[]

			try {
				logger.log(`[Repository] Using batch RPC for ${chunks.length} chunks`)

				const batchResults =
					await circlesRpc.getProfilesByAddressBatches(chunks)

				// Process batch results with error handling
				chunkResults = await Promise.all(
					batchResults.map(async (result, index) => {
						const chunk = chunks[index]
						const chunkNumber = index + CHUNK_NUMBER_OFFSET

						if (result.error) {
							logger.error(
								`[Repository] Batch chunk ${chunkNumber}/${chunks.length} failed:`,
								result.error
							)

							// Check if this is a batch size error and we can retry with smaller batch
							const newBatchSize = getBatchSizeFromError(result.error)
							if (newBatchSize && newBatchSize < batchSize) {
								logger.log(
									`[Repository] Retrying chunk ${chunkNumber} with smaller batch size: ${newBatchSize} (was ${batchSize})`
								)
								// Recursive call with new batch size for this specific chunk
								const retryResult = await profileRepository.getProfiles(
									chunk as Address[],
									newBatchSize
								)

								// Convert result back to chunk format
								const retryProfiles = chunk.map(
									(address) => retryResult[address]
								)
								return { chunk, profiles: retryProfiles, chunkIndex: index }
							}

							// Return null array for failed chunk, maintaining order
							const nullProfiles = Array.from({ length: chunk.length }).fill(
								null
							) as null[]
							return { chunk, profiles: nullProfiles, chunkIndex: index }
						}

						logger.log(
							`[Repository] Batch chunk ${chunkNumber}/${chunks.length} completed with ${result.profiles.length} profiles`
						)
						return { chunk, profiles: result.profiles, chunkIndex: index }
					})
				)
			} catch (batchError) {
				// Fallback to Promise.all approach if batch request fails entirely
				logger.warn(
					'[Repository] Batch RPC request failed, falling back to individual requests:',
					batchError
				)

				const chunkPromises = chunks.map(async (chunk, chunkIndex) => {
					try {
						const chunkNumber = chunkIndex + CHUNK_NUMBER_OFFSET
						logger.log(
							`[Repository] Processing fallback chunk ${chunkNumber}/${chunks.length} with ${chunk.length} addresses`
						)
						const profiles = await circlesRpc.getProfileByAddressBatch(chunk)

						// Return chunk with its addresses for proper mapping
						return { chunk, profiles, chunkIndex }
					} catch (error) {
						const chunkNumber = chunkIndex + CHUNK_NUMBER_OFFSET
						logger.error(
							`[Repository] Failed to fetch fallback chunk ${chunkNumber}/${chunks.length}:`,
							error
						)

						// Check if this is a batch size error and we can retry with smaller batch
						const newBatchSize = getBatchSizeFromError((error as Error).message)
						if (newBatchSize && newBatchSize < batchSize) {
							logger.log(
								`[Repository] Retrying fallback chunk ${chunkNumber} with smaller batch size: ${newBatchSize} (was ${batchSize})`
							)
							// Recursive call with new batch size for this specific chunk
							const retryResult = await profileRepository.getProfiles(
								chunk as Address[],
								newBatchSize
							)

							// Convert result back to chunk format
							const retryProfiles = chunk.map((address) => retryResult[address])
							return { chunk, profiles: retryProfiles, chunkIndex }
						}

						// Return null array for failed chunk, maintaining order
						const nullProfiles = Array.from({ length: chunk.length }).fill(
							null
						) as null[]
						return { chunk, profiles: nullProfiles, chunkIndex }
					}
				})

				chunkResults = await Promise.all(chunkPromises)
			}

			// Map results back to addresses, preserving order
			const result: Record<string, Profile | null> = {}

			for (const { chunk, profiles } of chunkResults) {
				for (const [index, address] of chunk.entries()) {
					const profile = profiles[index]
					result[address] = adaptNullableProfileFromRpc(profile)
				}
			}

			logger.log(
				`[Repository] Successfully fetched ${Object.keys(result).length} profiles`
			)

			return result
		} catch (error) {
			logger.error('[Repository] Failed to fetch profiles:', error)
			throw new Error('Failed to fetch profiles')
		}
	},

	// Search profiles by query with pagination to get all results
	searchProfiles: async (query: string): Promise<Profile[]> => {
		try {
			const allProfiles: Profile[] = []
			let offset = 0
			let hasMore = true

			// eslint-disable-next-line no-await-in-loop
			while (hasMore) {
				logger.log(
					`[Repository] Fetching profiles batch: offset=${offset}, limit=${RPC_SEARCH_LIMIT}`
				)

				// eslint-disable-next-line no-await-in-loop
				const results = await circlesRpc.searchProfiles(
					query,
					RPC_SEARCH_LIMIT,
					offset
				)
				const profiles = results.map((profile) => adaptProfileFromRpc(profile))

				allProfiles.push(...profiles)

				// If we got fewer results than the limit, we've reached the end
				hasMore = results.length === RPC_SEARCH_LIMIT
				offset += RPC_SEARCH_LIMIT

				// Safety check to prevent infinite loops
				if (offset > MAX_SEARCH_OFFSET) {
					logger.warn('[Repository] Search reached maximum offset limit')
					break
				}
			}

			logger.log(
				`[Repository] Search completed: found ${allProfiles.length} profiles total`
			)

			return allProfiles
		} catch (error) {
			logger.error('[Repository] Failed to search profiles:', error)
			throw new Error('Failed to search profiles')
		}
	}
}

// Cache time constants
const PROFILE_CACHE_MINUTES = 10

// React Query hooks
export const useProfiles = (addresses: Address[] = []) =>
	useQuery({
		queryKey: profileKeys.list(addresses.map((a) => a.toLowerCase())),
		queryFn: async () => {
			if (addresses.length === 0) return {}
			return profileRepository.getProfiles(addresses)
		},
		enabled: addresses.length > 0,
		staleTime: PROFILE_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})

// Minimum query length for search
const MIN_QUERY_LENGTH = 2

export const useSearchProfiles = (query: string) =>
	useQuery({
		queryKey: profileKeys.search(query),
		queryFn: async () => profileRepository.searchProfiles(query),
		enabled: query.length >= MIN_QUERY_LENGTH,
		staleTime: PROFILE_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})
