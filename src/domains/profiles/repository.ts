import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { isAddress } from 'viem'

import {
	DECIMAL_RADIX,
	DEFAULT_BATCH_SIZE,
	DEFAULT_IMAGE_BATCH_SIZE,
	MIN_BATCH_SIZE,
	ONE
} from 'constants/common'
import { MILLISECONDS_IN_A_MINUTE } from 'constants/time'
import { circlesProfiles } from 'services/circlesData'
import type { CirclesAvatarFromEnvio, IPFSData } from 'services/envio/indexer'
import { getProfilesForAddresses } from 'services/envio/indexer'
import logger from 'services/logger'

import type { SearchResultProfile } from '@circles-sdk/profiles'
import { adaptProfileFromSdk, convertEnvioProfileToProfile } from './adapters'
import type { Profile } from './types'

// Query keys
export const profileKeys = {
	all: ['profiles'] as const,
	detail: (id: string) => [...profileKeys.all, id] as const,
	list: (ids: string[]) =>
		[...profileKeys.all, 'list', ids.sort().join(',')] as const,
	search: (query: string) => [...profileKeys.all, 'search', query] as const
}

/**
 * Process batches of addresses to fetch profiles
 */
const processBatches = async (
	addressList: string[],
	currentBatchSize: number
): Promise<Profile[][]> => {
	// Split addresses into batches
	const addressBatches: Address[][] = []
	for (let index = 0; index < addressList.length; index += currentBatchSize) {
		addressBatches.push(
			addressList.slice(index, index + currentBatchSize) as Address[]
		)
	}

	try {
		// Create an array of promises for each batch
		const batchPromises = addressBatches.map(async (batch) => {
			logger.log(
				`[Repository] Fetching profiles batch of ${batch.length} addresses`
			)
			const results = await circlesProfiles.searchByAddresses(batch, {
				fetchComplete: true
			})
			return results.map((profile) => adaptProfileFromSdk(profile))
		})

		// Execute all batch requests in parallel
		return await Promise.all(batchPromises)
	} catch (error) {
		// Check if the error is about exceeding the maximum number of addresses
		const errorMessage = String(error)
		const limitMatch = errorMessage.match(
			/Maximum number of addresses exceeded\. Limit is (\d+)/
		)

		if (limitMatch?.[ONE]) {
			// Extract the limit from the error message and subtract MIN_BATCH_SIZE for safety
			const newBatchSize = Math.max(
				MIN_BATCH_SIZE,
				Number.parseInt(limitMatch[ONE], DECIMAL_RADIX) - MIN_BATCH_SIZE
			)
			logger.log(
				`[Repository] Adjusting batch size to ${newBatchSize} based on API limit`
			)

			// Retry with the new batch size
			return processBatches(addressList, newBatchSize)
		}

		logger.error('[Repository] Failed to fetch profiles:', error)
	}

	return []
}

/**
 * Fetch profiles by CIDs
 */
const getProfileByCids = async (
	cids: string[],
	currentBatchSize: number
): Promise<Record<string, Profile>> => {
	// Split CIDs into batches
	const cidBatches: string[][] = []
	for (let index = 0; index < cids.length; index += currentBatchSize) {
		cidBatches.push(cids.slice(index, index + currentBatchSize))
	}

	try {
		// Create an array of promises for each batch
		const batchPromises = cidBatches.map(async (batch) => {
			logger.log(`[Repository] Fetching profiles batch of ${batch.length} CIDs`)
			const results = await circlesProfiles.getMany(batch)

			// Convert to our domain type
			const profiles: Record<string, Profile> = {}
			for (const [cid, profile] of Object.entries(results)) {
				profiles[cid] = adaptProfileFromSdk(profile as SearchResultProfile)
			}

			return profiles
		})

		// Execute all batch requests in parallel
		const batchResults = await Promise.all(batchPromises)

		// Merge all batch results into a single record
		const mergedProfiles: Record<string, Profile> = {}
		for (const batchResult of batchResults) {
			Object.assign(mergedProfiles, batchResult)
		}

		return mergedProfiles
	} catch (error) {
		// Check if the error is about exceeding the maximum number of CIDs
		const errorMessage = String(error)
		const limitMatch = errorMessage.match(
			/Maximum number of (?:cids|CIDs) exceeded\. Limit is (\d+)/
		)

		if (limitMatch?.[ONE]) {
			// Extract the limit from the error message and subtract MIN_BATCH_SIZE for safety
			const newBatchSize = Math.max(
				MIN_BATCH_SIZE,
				Number.parseInt(limitMatch[ONE], DECIMAL_RADIX) - MIN_BATCH_SIZE
			)
			logger.log(
				`[Repository] Adjusting batch size to ${newBatchSize} based on API limit`
			)

			// Retry with the new batch size
			return getProfileByCids(cids, newBatchSize)
		}

		logger.error('[Repository] Failed to fetch profiles preview image:', error)
		return {}
	}
}

// Repository methods
export const profileRepository = {
	// Get a single profile
	getProfile: async (address: Address): Promise<Profile | null> => {
		try {
			if (!isAddress(address)) return null

			const results = await circlesProfiles.searchByAddress(address, {
				fetchComplete: true
			})

			if (results.length > 0) {
				return adaptProfileFromSdk(results[0])
			}

			// Try fallback to envio
			try {
				const envioProfiles = await getProfilesForAddresses([address])
				if (envioProfiles.length > 0) {
					return convertEnvioProfileToProfile(envioProfiles[0])
				}
			} catch (envioError) {
				logger.error(
					'[Repository] Failed to fetch profile from envio:',
					envioError
				)
			}

			return null
		} catch (error) {
			logger.error('[Repository] Failed to fetch profile:', error)
			throw new Error('Failed to fetch profile')
		}
	},

	// Get multiple profiles
	getProfiles: async (
		addresses: Address[]
	): Promise<Record<string, Profile | null>> => {
		try {
			if (addresses.length === 0) return {}

			const result: Record<string, Profile | null> = {}

			// Filter out addresses that are not valid
			const validAddresses = addresses.filter((addr) => isAddress(addr))
			if (validAddresses.length === 0) return {}

			// Fetch profiles from primary service
			const batchResults = await processBatches(
				validAddresses.map((addr) => addr.toLowerCase()),
				DEFAULT_BATCH_SIZE
			)

			// Create a map of addresses that were fetched but not found
			const notFoundAddresses = new Set(
				validAddresses.map((addr) => addr.toLowerCase())
			)

			// Process successful results from primary service
			for (const results of batchResults) {
				for (const profile of results) {
					if (profile.address) {
						result[profile.address.toLowerCase()] = profile
						notFoundAddresses.delete(profile.address.toLowerCase())
					}
				}
			}

			// If we have addresses with no profiles, try envio as fallback
			if (notFoundAddresses.size > 0) {
				try {
					const envioProfiles = await getProfilesForAddresses([
						...notFoundAddresses
					] as Address[])

					// Extract valid CIDs
					const cidsToExtract: string[] = []
					for (const account of envioProfiles) {
						if (account.profile?.cidV0) {
							cidsToExtract.push(account.profile.cidV0)
						}
					}

					// Fetch profiles by CIDs
					const profileResults =
						cidsToExtract.length > 0
							? await getProfileByCids(
									cidsToExtract,
									DEFAULT_IMAGE_BATCH_SIZE as number
								)
							: {}

					// Process profiles in a single pass
					for (const envioProfile of envioProfiles) {
						// Get CID safely
						const cidV0 = envioProfile.profile?.cidV0 ?? ''

						// Get preview image safely
						let profilePreviewImage = ''
						if (cidV0 && Object.hasOwn(profileResults, cidV0)) {
							profilePreviewImage = profileResults[cidV0].previewImageUrl ?? ''
						}

						// Create merged profile with preview image
						const mergedEnvioProfile: CirclesAvatarFromEnvio = {
							...envioProfile,
							profile: envioProfile.profile
								? ({
										...envioProfile.profile,
										previewImageUrl: profilePreviewImage
									} as IPFSData)
								: undefined
						}

						// Convert and set profile
						const profile = convertEnvioProfileToProfile(mergedEnvioProfile)
						result[envioProfile.id.toLowerCase()] = profile
						notFoundAddresses.delete(envioProfile.id.toLowerCase())
					}
				} catch (envioError) {
					logger.error(
						'[Repository] Failed to fetch profiles from envio:',
						envioError
					)
				}
			}

			// For any remaining addresses not found in either service, set them to null
			for (const address of notFoundAddresses) {
				result[address] = null
			}

			return result
		} catch (error) {
			logger.error('[Repository] Failed to fetch profiles:', error)
			throw new Error('Failed to fetch profiles')
		}
	},

	// Search profiles by query
	searchProfiles: async (query: string): Promise<Profile[]> => {
		try {
			const results = await circlesProfiles.search({ name: query })
			return results.map((profile) => adaptProfileFromSdk(profile))
		} catch (error) {
			logger.error('[Repository] Failed to search profiles:', error)
			throw new Error('Failed to search profiles')
		}
	}
}

// Cache time constants
const PROFILE_CACHE_MINUTES = 10

// React Query hooks
export const useProfile = (address?: Address) =>
	useQuery({
		queryKey: address
			? profileKeys.detail(address.toLowerCase())
			: profileKeys.all,
		queryFn: async () => {
			if (!address) throw new Error('Address is required')
			return profileRepository.getProfile(address)
		},
		enabled: !!address,
		staleTime: PROFILE_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})

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
