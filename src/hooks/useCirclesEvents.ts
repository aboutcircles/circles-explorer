import type { CirclesEventType } from '@circles-sdk/data'
import { useCallback, useEffect, useMemo } from 'react'

import { avatarFields } from 'constants/avatarFields'
import { ONE } from 'constants/common'
import { useBlockNumber } from 'services/viemClient'
import { useProfiles } from 'hooks/useProfiles'
import {
	useFetchCirclesEventsInfinite,
	type EventsInfiniteData
} from 'services/circlesEvents'
import logger from 'services/logger'
import { useFilterStore } from 'stores/useFilterStore'
import type { Event } from 'types/events'
import { useStartBlock } from './useStartBlock'

export const useCirclesEvents = () => {
	const eventTypes = useFilterStore.use.eventTypes()
	const search = useFilterStore.use.search()
	const updateEventTypesAmount = useFilterStore.use.updateEventTypesAmount()
	const { currentStartBlock } = useStartBlock()
	const updateStartBlock = useFilterStore.use.updateStartBlock()

	const blockNumber = useBlockNumber()

	// Use the infinite query that automatically fetches and merges pages
	const {
		data,
		isLoading: isEventsLoading,
		isFetchingNextPage: isLoadingMore,
		fetchNextPage,
		hasNextPage
	} = useFetchCirclesEventsInfinite(
		currentStartBlock,
		Boolean(blockNumber),
		!search,
		search
	)

	// Extract all events from all pages
	const allEvents = useMemo(() => {
		if (!data) return []

		// Flatten all pages and deduplicate events
		const eventMap = new Map<string, Event>()

		// Type-safe access to pages
		const { pages } = data as unknown as EventsInfiniteData

		for (const page of pages) {
			for (const event of page.events) {
				eventMap.set(event.key, event)
			}
		}

		// Convert to array and sort by timestamp
		return [...eventMap.values()].sort(
			(a, b) => Number(b.timestamp) - Number(a.timestamp)
		)
	}, [data])

	// Merge all eventTypesAmount maps from all pages
	useEffect(() => {
		if (!data) return

		const mergedEventTypes = new Map<CirclesEventType, number>()

		// Type-safe access to pages
		const { pages } = data as unknown as EventsInfiniteData

		for (const page of pages) {
			for (const [type, count] of page.eventTypesAmount.entries()) {
				mergedEventTypes.set(type, (mergedEventTypes.get(type) ?? 0) + count)
			}
		}

		updateEventTypesAmount(mergedEventTypes)
	}, [data, updateEventTypesAmount])

	// Load more events by fetching the next page
	const loadMoreEvents = useCallback(async () => {
		if (isLoadingMore || !hasNextPage) return

		logger.log('[hooks][useCirclesEvents] Loading more events')

		const result = await fetchNextPage()
		const nextPageData: EventsInfiniteData | undefined =
			result.data as unknown as EventsInfiniteData

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!nextPageData) return

		const { finalStartBlock } =
			nextPageData.pages[nextPageData.pages.length - ONE]

		updateStartBlock(finalStartBlock)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetchNextPage, hasNextPage, isLoadingMore])

	// Filter events by selected event types
	const filteredEvents = useMemo(() => {
		if (allEvents.length === 0) return []

		return allEvents.filter((event: Event): boolean =>
			eventTypes.has(event.event)
		)
	}, [allEvents, eventTypes])

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
		hasMoreEvents: hasNextPage
	}
}
