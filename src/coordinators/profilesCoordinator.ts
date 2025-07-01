import { useCallback, useEffect, useState } from 'react'
import type { Address } from 'viem'
import { isAddress } from 'viem'

import { avatarFields } from 'constants/avatarFields'
import { botRepository } from 'domains/bots/repository'
import { useProfiles } from 'domains/profiles/repository'
import logger from 'services/logger'
import { useProfileStore } from 'stores/useProfileStore'
import type { ProcessedEvent } from 'types/events'
import { isNil } from 'utils/isNil'

/**
 * Coordinator for profiles data with React Query integration
 *
 * This coordinator orchestrates fetching profiles data using React Query
 * and manages the profile store for caching and bot verdicts.
 */
export function useProfilesCoordinator() {
	const [addressesToFetch, setAddressesToFetch] = useState<Address[]>([])

	// Use React Query hook for profiles
	const { data: profilesData = {}, isLoading } = useProfiles(addressesToFetch)

	// Store methods for bot verdicts and local caching
	const setProfile = useProfileStore.use.setProfile()
	const getProfile = useProfileStore.use.getProfile()
	const profiles = useProfileStore.use.profiles()
	const setBotVerdicts = useProfileStore.use.setBotVerdicts()
	const getBotVerdict = useProfileStore.use.getBotVerdict()

	// Update store when React Query data changes
	useEffect(() => {
		if (Object.keys(profilesData).length > 0) {
			for (const [address, profile] of Object.entries(profilesData)) {
				setProfile(address, profile)
			}
		}
	}, [profilesData, setProfile])

	/**
	 * Fetch multiple profiles using React Query
	 */
	const fetchProfiles = useCallback(
		async (addresses: string[]): Promise<void> => {
			if (addresses.length === 0) return

			// Filter out addresses that are already in cache or not valid
			const validAddressesToFetch = addresses.filter(
				(address) =>
					isAddress(address) && getProfile(address.toLowerCase()) === undefined
			)

			if (validAddressesToFetch.length === 0) return

			// Set addresses for React Query to fetch
			setAddressesToFetch(validAddressesToFetch as Address[])

			// Fetch bot verdicts for all addresses
			try {
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
		},
		[getProfile, getBotVerdict, setBotVerdicts, setAddressesToFetch]
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
