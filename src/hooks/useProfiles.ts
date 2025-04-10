import { useCallback } from 'react'
import type { Address } from 'viem'
import { isAddress } from 'viem'

import type { SearchResultProfile } from '@circles-sdk/profiles'
import { circlesProfiles } from 'services/circlesData'
import logger from 'services/logger'
import { useProfileStore } from 'stores/useProfileStore'
import {
	DEFAULT_BATCH_SIZE,
	MIN_BATCH_SIZE,
	DECIMAL_RADIX,
	ONE
} from 'constants/common'

const processBatches = async (
	addressList: string[],
	currentBatchSize: number
): Promise<SearchResultProfile[][]> => {
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
			logger.log(`Fetching profiles batch of ${batch.length} addresses`)
			return circlesProfiles.searchByAddresses(batch, {
				fetchComplete: true
			})
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
			logger.log(`Adjusting batch size to ${newBatchSize} based on API limit`)

			// Retry with the new batch size
			return processBatches(addressList, newBatchSize)
		}

		logger.error('Failed to fetch profiles:', error)
	}

	return []
}

export function useProfiles() {
	const setProfile = useProfileStore.use.setProfile()
	const getProfile = useProfileStore.use.getProfile()
	const profiles = useProfileStore.use.profiles()
	const isLoading = useProfileStore.use.isLoading()
	const setIsLoading = useProfileStore.use.setIsLoading()

	const fetchProfile = useCallback(
		async (
			address: string
		): Promise<SearchResultProfile | null | undefined> => {
			if (!isAddress(address)) return undefined

			// Check cache first (including null profiles)
			const cachedProfile = getProfile(address.toLowerCase())
			if (cachedProfile !== undefined) return cachedProfile

			try {
				const results = await circlesProfiles.searchByAddress(address, {
					fetchComplete: true
				})
				if (results.length > 0) {
					setProfile(address, results[0])
					return results[0]
				}
				// Profile not found - cache as null
				setProfile(address, null)
				return null
			} catch (error) {
				logger.error('Failed to fetch profile:', error)
				return undefined
			}
		},
		[getProfile, setProfile]
	)

	const fetchProfiles = useCallback(
		async (addresses: string[]): Promise<void> => {
			if (addresses.length === 0) return

			// Filter out addresses that are already in cache (including null profiles) or not valid
			const addressesToFetch = addresses.filter(
				(address) => getProfile(address.toLowerCase()) === undefined
			)

			if (addressesToFetch.length === 0) return

			setIsLoading(true)
			try {
				const batchResults = await processBatches(
					addressesToFetch,
					DEFAULT_BATCH_SIZE
				)

				// Create a map of addresses that were fetched
				const fetchedAddresses = new Set(
					addressesToFetch.map((addr) => addr.toLowerCase())
				)

				// Process successful results
				for (const results of batchResults) {
					for (const profile of results) {
						if (profile.address) {
							setProfile(profile.address, profile)
							// Remove from the set of fetched addresses
							fetchedAddresses.delete(profile.address.toLowerCase())
						}
					}
				}

				// For any addresses that were fetched but not found in results, set them to null
				for (const address of fetchedAddresses) {
					setProfile(address, null)
				}
			} catch (error) {
				logger.error('Failed to fetch profiles:', error)
			} finally {
				setIsLoading(false)
			}
		},
		[getProfile, setProfile, setIsLoading]
	)

	return {
		profiles,
		fetchProfile,
		fetchProfiles,
		getProfile,
		isLoading
	}
}
