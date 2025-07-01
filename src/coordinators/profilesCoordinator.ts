import { useCallback } from 'react'
import type { Address } from 'viem'
import { isAddress } from 'viem'

import { avatarFields } from 'constants/avatarFields'
import { botRepository } from 'domains/bots/repository'
import { profileRepository } from 'domains/profiles/repository'
import logger from 'services/logger'
import { useProfileStore } from 'stores/useProfileStore'
import type { ProcessedEvent } from 'types/events'
import { isNil } from 'utils/isNil'

/**
 * Coordinator for profiles data
 *
 * This coordinator orchestrates fetching profiles data from multiple sources
 * and manages the profile store.
 */
export function useProfilesCoordinator() {
	const setProfile = useProfileStore.use.setProfile()
	const getProfile = useProfileStore.use.getProfile()
	const profiles = useProfileStore.use.profiles()
	const isLoading = useProfileStore.use.isLoading()
	const setIsLoading = useProfileStore.use.setIsLoading()
	const setBotVerdicts = useProfileStore.use.setBotVerdicts()
	const getBotVerdict = useProfileStore.use.getBotVerdict()

	/**
	 * Fetch multiple profiles
	 */
	const fetchProfiles = useCallback(
		async (addresses: string[]): Promise<void> => {
			if (addresses.length === 0) return

			// Filter out addresses that are already in cache (including null profiles) or not valid
			const addressesToFetch = addresses.filter(
				(address) =>
					isAddress(address) && getProfile(address.toLowerCase()) === undefined
			)

			if (addressesToFetch.length === 0) return

			setIsLoading(true)
			try {
				// Fetch profiles
				const profilesResult = await profileRepository.getProfiles(
					addressesToFetch as Address[]
				)

				// Update store with results
				for (const [address, profile] of Object.entries(profilesResult)) {
					setProfile(address, profile)
				}

				// Fetch bot verdicts for all addresses
				try {
					// Only fetch bot verdicts for addresses that don't already have them
					const addressesForBotCheck = addresses.filter(
						(address) => getBotVerdict(address.toLowerCase()) === undefined
					)

					if (addressesForBotCheck.length > 0) {
						logger.log(
							`[Coordinator] Fetching bot verdicts for ${addressesForBotCheck.length} addresses`
						)
						const botVerdicts = await botRepository.getBotVerdicts(
							addressesForBotCheck as Address[]
						)
						setBotVerdicts(botVerdicts)
					}
				} catch (botError) {
					logger.error('[Coordinator] Failed to fetch bot verdicts:', botError)
				}
			} catch (error) {
				logger.error('[Coordinator] Failed to fetch profiles:', error)
			} finally {
				setIsLoading(false)
			}
		},
		[getProfile, setProfile, setIsLoading, getBotVerdict, setBotVerdicts]
	)

	/**
	 * Load profiles for events
	 */
	const loadProfilesForEvents = useCallback(
		(events: ProcessedEvent[]): void => {
			if (events.length === 0) return

			// Extract all addresses from events using a Set to deduplicate
			const addresses = new Set<string>()
			for (const event of events) {
				// Check if the event has avatar fields
				for (const field of avatarFields) {
					if (field in event) {
						const value = (event as unknown as Record<string, unknown>)[field]
						if (!isNil(value)) {
							addresses.add(String(value).toLowerCase())
						}
					}
				}

				// Also check sub-events if present
				if (event.isExpandable && event.subEvents.length > 0) {
					for (const subEvent of event.subEvents) {
						for (const field of avatarFields) {
							if (field in subEvent) {
								const value = (subEvent as unknown as Record<string, unknown>)[
									field
								]
								if (!isNil(value)) {
									addresses.add(String(value).toLowerCase())
								}
							}
						}
					}
				}
			}

			if (addresses.size > 0) {
				void fetchProfiles([...addresses])
			}
		},
		[fetchProfiles]
	)

	/**
	 * Load profiles for Avatar page
	 */
	const loadProfilesForAvatar = useCallback(
		(
			address: string,
			avatar: { invitedBy?: Address; id: string },
			trustRelations: {
				given: { address: Address }[]
				received: { address: Address }[]
			},
			invitations: { avatar: Address }[]
		): void => {
			if (!address || !isAddress(address as Address)) return

			// use Set to avoid duplicates and later check for cached profiles
			const addresses = new Set<string>()

			// Add the avatar address
			addresses.add(address.toLowerCase())

			// Add invited by address if available
			if (avatar.invitedBy) {
				addresses.add(avatar.invitedBy.toLowerCase())
			}

			// Add addresses from trust relations
			for (const relation of [
				...trustRelations.given,
				...trustRelations.received
			]) {
				addresses.add(relation.address.toLowerCase())
			}

			// Add addresses from invites
			for (const invite of invitations) {
				addresses.add(invite.avatar.toLowerCase())
			}

			if (addresses.size > 0) {
				void fetchProfiles([...addresses])
			}
		},
		[fetchProfiles]
	)

	return {
		profiles,
		fetchProfiles,
		getProfile,
		getBotVerdict,
		isLoading,
		loadProfilesForEvents,
		loadProfilesForAvatar
	}
}
