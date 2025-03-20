import { useCallback, useEffect, useMemo, useState } from 'react'

import { avatarFields } from 'constants/avatarFields'
import { DEFAULT_BLOCK_RANGE, MAX_BLOCK_RANGE } from 'constants/blockRange'
import { useBlockNumber } from 'hooks/useBlockNumber'
import { useProfiles } from 'hooks/useProfiles'
import { useFetchCirclesEventsRecursive } from 'services/circlesIndex'
import logger from 'services/logger'
import { useFilterStore } from 'stores/useFilterStore'
import type { Event } from 'types/events'

export const useCirclesEvents = () => {
	const eventTypes = useFilterStore.use.eventTypes()
	const search = useFilterStore.use.search()
	const updateEventTypesAmount = useFilterStore.use.updateEventTypesAmount()
	const startBlock = useFilterStore.use.startBlock()
	const updateStartBlock = useFilterStore.use.updateStartBlock()

	const eventsLength = useFilterStore.use.eventsLength()
	const setEventsLength = useFilterStore.use.setEventsLength()

	const blockNumber = useBlockNumber()

	// State for infinite scroll
	const [hasMoreEvents, setHasMoreEvents] = useState(true)
	const [isLoadingMore, setIsLoadingMore] = useState(false)

	// Initialize block range when block number is available and startBlock is not set
	useEffect(() => {
		if (blockNumber && startBlock === 0) {
			// Start from the latest block and go back by DEFAULT_BLOCK_RANGE
			const newStartBlock = Math.max(0, blockNumber - DEFAULT_BLOCK_RANGE)
			updateStartBlock(newStartBlock)
		}
	}, [blockNumber, startBlock, updateStartBlock])

	// Use the recursive query that automatically doubles range until events are found
	const {
		data: { events, eventTypesAmount, finalRange, finalStartBlock } = {},
		isLoading: isEventsLoading,
		isSuccess,
		refetch
	} = useFetchCirclesEventsRecursive(
		startBlock,
		Boolean(blockNumber) && startBlock > 0,
		!search,
		search,
		eventsLength
	)

	useEffect(() => {
		// save eventsLength to use for next recursive query to understand when we got new ones
		if (events) {
			setEventsLength(events.length)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [events])

	useEffect(() => {
		// update start block to reflect changes and show the correct start block
		if (finalStartBlock) updateStartBlock(finalStartBlock)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [finalStartBlock])

	// Load more events by going back by finalRange
	const loadMoreEvents = useCallback(() => {
		if (!hasMoreEvents || isLoadingMore || !finalRange) return

		setIsLoadingMore(true)

		// Calculate new start block for loading more
		const newStartBlock = Math.max(0, startBlock - finalRange)

		// If we've reached block 0, there are no more events to load
		if (newStartBlock === 0) {
			setHasMoreEvents(false)
			setIsLoadingMore(false)
			return
		}

		logger.log(
			'[hooks][useCirclesEvents] Loading more events from block',
			newStartBlock
		)

		updateStartBlock(newStartBlock)
		setIsLoadingMore(false)
		// trigger a new query
		void refetch()
	}, [
		refetch,
		hasMoreEvents,
		isLoadingMore,
		finalRange,
		startBlock,
		updateStartBlock
	])

	// Reset loading state when query completes
	useEffect(() => {
		if (isSuccess && isLoadingMore) {
			setIsLoadingMore(false)
		}
	}, [isSuccess, isLoadingMore])

	// Update event type amounts when data changes
	useEffect(() => {
		if (eventTypesAmount) {
			updateEventTypesAmount(eventTypesAmount)
		}
	}, [updateEventTypesAmount, eventTypesAmount])

	// Filter events by selected event types
	const filteredEvents = useMemo(() => {
		if (!events) return []

		return events.filter((event: Event): boolean => eventTypes.has(event.event))
	}, [events, eventTypes])

	// Prefetch profiles for all addresses in the events
	const { fetchProfiles } = useProfiles()
	useEffect(() => {
		if (filteredEvents.length === 0) return

		// Extract all addresses from events using a Set to deduplicate
		const addresses = new Set<string>()
		for (const event of filteredEvents) {
			// Check if the event has the avatar field
			for (const field of avatarFields) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				if (field in event && event[field]) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					addresses.add(String(event[field]).toLowerCase())
				}
			}
		}

		if (addresses.size > 0) {
			void fetchProfiles([...addresses])
		}
	}, [filteredEvents, fetchProfiles])

	return {
		events: filteredEvents,
		isEventsLoading,
		isLoadingMore,
		loadMoreEvents,
		hasMoreEvents,
		// Block loading more if the range is too large
		isBlockedLoadingMore: blockNumber
			? blockNumber - startBlock > MAX_BLOCK_RANGE
			: true
	}
}
