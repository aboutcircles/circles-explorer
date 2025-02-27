import { useCallback } from 'react'
import type { Address } from 'viem'
import { isAddress } from 'viem'

import type { SearchResultProfile } from '@circles-sdk/profiles'
import { circlesProfiles } from 'services/circlesData'
import logger from 'services/logger'
import { useProfileStore } from 'stores/useProfileStore'

export function useProfiles() {
	const setProfile = useProfileStore.use.setProfile()
	const getProfile = useProfileStore.use.getProfile()
	const profiles = useProfileStore.use.profiles()

	const fetchProfile = useCallback(
		async (address: string): Promise<SearchResultProfile | undefined> => {
			if (!isAddress(address)) return undefined

			// Check cache first
			const cachedProfile = getProfile(address)
			if (cachedProfile) return cachedProfile

			try {
				const results = await circlesProfiles.searchByAddress(address, {
					fetchComplete: true
				})
				if (results.length > 0) {
					setProfile(address, results[0])
					return results[0]
				}
				return undefined
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

			// Filter out addresses that are already in cache or not valid
			const addressesToFetch = addresses.filter(
				(address) => isAddress(address) && !getProfile(address)
			)

			if (addressesToFetch.length === 0) return

			try {
				const results = await circlesProfiles.searchByAddresses(
					addressesToFetch as Address[],
					{ fetchComplete: true }
				)

				for (const profile of results) {
					if (profile.address) {
						setProfile(profile.address, profile)
					}
				}
			} catch (error) {
				logger.error('Failed to fetch profiles:', error)
			}
		},
		[getProfile, setProfile]
	)

	return {
		profiles,
		fetchProfile,
		fetchProfiles,
		getProfile
	}
}
