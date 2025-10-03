import { useCallback, useEffect } from 'react'

import { useEvents } from 'domains/events/repository'
import { useProfilesCoordinator } from './profilesCoordinator'

/**
 * Coordinator for events data
 *
 * This coordinator orchestrates fetching events data and related profiles.
 */
export function useEventsCoordinator(
	address: string | null = null,
	txHash: string | null = null
) {
	// Get events data
	const {
		events,
		isEventsLoading,
		isLoadingMore,
		loadMoreEvents,
		hasMoreEvents
	} = useEvents(address, txHash)

	// Get profiles coordinator
	const { loadProfilesForEvents } = useProfilesCoordinator()

	// Prefetch profiles for all addresses in the events
	useEffect(() => {
		loadProfilesForEvents(events)
	}, [events, loadProfilesForEvents])

	// Load more events function with additional profile loading
	const loadMoreEventsWithProfiles = useCallback(async () => {
		await loadMoreEvents()
		// Profiles will be loaded automatically via the useEffect above
	}, [loadMoreEvents])

	return {
		events,
		isEventsLoading,
		isLoadingMore,
		loadMoreEvents: loadMoreEventsWithProfiles,
		hasMoreEvents
	}
}
