import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import type { Address, Hex } from 'viem'
import { hexToNumber, isAddress } from 'viem'

import type { CirclesEventType } from '@circles-sdk/data'
import axios from 'axios'
import {
	DEFAULT_BLOCK_RANGE,
	MAX_BLOCK_RANGE,
	MAX_RETRY_COUNT,
	RANGE_MULTIPLIER,
	RETRY_INCREMENT
} from 'constants/blockRange'
import { CIRCLES_INDEXER_URL, MINUS_ONE, ONE } from 'constants/common'
import { MILLISECONDS_IN_A_MINUTE } from 'constants/time'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { circlesData } from 'services/circlesData'
import logger from 'services/logger'
import { useFilterStore } from 'stores/useFilterStore'
import type { CirclesEventsResponse, Event } from 'types/events'
import { isNil } from 'utils/isNil'

import { useStartBlock } from 'hooks/useStartBlock'
import { useParams } from 'react-router-dom'
import { useBlockNumber } from 'services/viemClient'
import { defineFiltersFromSearch, getEventKey, processEvents } from './adapters'
import type {
	EventsInfiniteData,
	EventsQueryResult,
	InitialPageParameter,
	PageParameter,
	PageResult
} from './types'

// Query keys
const CIRCLES_EVENTS_INFINITE_QUERY_KEY = 'circlesEventsInfinite'
export const eventsKeys = {
	all: ['events'] as const,
	infinite: (address: string | null, search: string | null) =>
		[CIRCLES_EVENTS_INFINITE_QUERY_KEY, search] as const
}

// Repository methods
export const eventsRepository = {
	// Fetch events
	getEvents: async (
		startBlock: number,
		endBlock: number | null,
		search: string | null
	): Promise<{
		events: Event[]
		eventTypesAmount: Map<CirclesEventType, number>
	}> => {
		try {
			const addressToUse = isAddress(search ?? '') ? search : null
			const filters = addressToUse ? null : defineFiltersFromSearch(search)

			const response = await axios.post<CirclesEventsResponse>(
				CIRCLES_INDEXER_URL,
				{
					method: 'circles_events',
					params: filters
						? [null, 0, null, null, filters]
						: [addressToUse, startBlock, endBlock]
				}
			)

			const eventTypesAmount = new Map<CirclesEventType, number>()
			const events = response.data.result.map((event) => {
				eventTypesAmount.set(
					event.event,
					(eventTypesAmount.get(event.event) ?? 0) + ONE
				)

				return {
					...event,
					...event.values,
					blockNumber: hexToNumber(event.values.blockNumber as Hex),
					timestamp: hexToNumber(event.values.timestamp as Hex),
					logIndex: hexToNumber(event.values.logIndex as Hex),
					transactionIndex: hexToNumber(event.values.transactionIndex as Hex),
					values: null,
					key: getEventKey(
						event.values.transactionHash,
						Number(event.values.logIndex)
					)
				}
			})

			logger.log(
				'[Repository] Queried circles events',
				`Event count: ${events.length}, startBlock: ${startBlock}, endBlock: ${endBlock}`
			)

			return { events, eventTypesAmount }
		} catch (error) {
			logger.error('[Repository] Failed to query circles events', error)
			throw new Error('Failed to query circles events')
		}
	},

	// Subscribe to events
	subscribeToEvents: async (address?: Address) =>
		address
			? circlesData.subscribeToEvents(address)
			: circlesData.subscribeToEvents()
}

/**
 * Helper function to fetch a page of events with retry logic
 */
const fetchEventsPage = async ({
	startBlock,
	endBlock,
	range,
	search
}: PageParameter & {
	search: string | null
}): Promise<PageResult> => {
	const fetchWithRetry = async (
		currentRange: number,
		currentStartBlock: number,
		currentEndBlock: number | null,
		tryCount: number
	): Promise<PageResult> => {
		// Base case: reached max retries
		if (tryCount >= MAX_RETRY_COUNT) {
			return {
				events: [],
				eventTypesAmount: new Map(),
				finalRange: currentRange,
				finalStartBlock: currentStartBlock
			}
		}

		// Fetch events for current range
		const response = await eventsRepository.getEvents(
			currentStartBlock,
			currentEndBlock,
			search
		)
		const newEventCount = response.events.length
		logger.log(`${currentStartBlock} - ${currentEndBlock} - ${newEventCount}`)

		// Success case: found events
		if (newEventCount > 0) {
			// Calculate next cursor for pagination
			const nextStartBlock = Math.max(0, currentStartBlock - currentRange)
			const nextCursor =
				nextStartBlock > 0
					? {
							startBlock: nextStartBlock,
							endBlock: currentStartBlock,
							range: currentRange
						}
					: undefined

			return {
				events: response.events,
				eventTypesAmount: response.eventTypesAmount,
				finalRange: currentRange,
				finalStartBlock: currentStartBlock,
				nextCursor
			}
		}

		// No events found, expand range
		const nextRange = Math.min(
			tryCount === 0 ? currentRange : currentRange * RANGE_MULTIPLIER,
			MAX_BLOCK_RANGE
		)
		// range increasing from initial block
		const nextStartBlock = Math.max(0, startBlock - nextRange)
		// nextEndBlock is the current start block (to shift the range)
		const nextEndBlock = currentStartBlock

		logger.log(
			`[Repository] Expanded range to ${nextRange} blocks (try ${tryCount})`
		)

		// Stop if we hit block 0
		if (nextStartBlock <= 0) {
			return {
				events: [],
				eventTypesAmount: new Map(),
				finalRange: nextRange,
				finalStartBlock: nextStartBlock
			}
		}

		// Recursive case: try with expanded range
		return fetchWithRetry(
			nextRange,
			nextStartBlock,
			nextEndBlock,
			tryCount + RETRY_INCREMENT
		)
	}

	// Start the recursive fetching
	return fetchWithRetry(range, startBlock, endBlock, 0)
}

// Cache time constants
const EVENTS_CACHE_MINUTES = 5

/**
 * Watch event updates
 */
const watchEventUpdates = async (
	queryKey: readonly [string, string | null],
	queryClient: ReturnType<typeof useQueryClient>,
	address: Address | null
) => {
	const avatarEvents = await (address
		? eventsRepository.subscribeToEvents(address)
		: eventsRepository.subscribeToEvents())

	return avatarEvents.subscribe((event) => {
		const key = getEventKey(
			event.transactionHash ?? `${event.blockNumber}-${event.transactionIndex}`,
			event.logIndex
		)

		queryClient.setQueryData(queryKey, (cacheData?: EventsInfiniteData) => {
			if (!cacheData) return null

			const updatedEventsData = [...cacheData.pages[0].events]
			// eslint-disable-next-line @typescript-eslint/prefer-destructuring
			const { eventTypesAmount } = cacheData.pages[0]

			const eventIndex = updatedEventsData.findIndex(
				(cacheEvent) => cacheEvent.key === key
			)

			// add new event
			if (eventIndex === MINUS_ONE) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				updatedEventsData.unshift({
					...event,
					key,
					event: event.$event
				})

				// update eventTypesAmount
				eventTypesAmount.set(
					event.$event,
					(eventTypesAmount.get(event.$event) ?? 0) + ONE
				)
			}

			return {
				...cacheData,
				pages: [
					{
						...cacheData.pages[0],
						events: updatedEventsData,
						eventTypesAmount
					},
					...cacheData.pages.slice(ONE)
				]
			}
		})
	})
}

/**
 * React Query hooks
 */
export const useEventsInfinite = (
	initialBlock: number,
	enabled: boolean,
	watch: boolean,
	search: string | null = null
) => {
	const queryClient = useQueryClient()
	const subscriptionReference = useRef<(() => void) | null>(null)

	// Query key only depends on search parameter
	const queryKey = useMemo(
		() => [CIRCLES_EVENTS_INFINITE_QUERY_KEY, search] as const,
		[search]
	)

	// Set up subscription when query is enabled and watch is true
	useEffect(() => {
		// Only set up subscription if enabled
		if (!enabled || !watch) {
			return () => {}
		}

		// Clean up any existing subscription first
		if (subscriptionReference.current) {
			subscriptionReference.current()
			subscriptionReference.current = null
		}

		// Flag to track if effect is still active
		let isActive = true

		// Setup subscription
		const setupSubscription = async () => {
			try {
				const addressToUse = isAddress(search ?? '') ? search : null
				const cleanup = await watchEventUpdates(
					queryKey,
					queryClient,
					addressToUse as Address | null
				)

				// Store cleanup function only if effect is still active
				if (isActive) {
					subscriptionReference.current = cleanup
				} else {
					// If effect was cleaned up during async operation, call cleanup directly
					cleanup()
				}
			} catch (error) {
				logger.error('[Repository] Failed to set up event subscription', error)
			}
		}

		// Start subscription setup
		void setupSubscription()

		// Clean up function
		return function cleanup() {
			isActive = false
			if (subscriptionReference.current) {
				const unsubscribe = subscriptionReference.current
				subscriptionReference.current = null
				unsubscribe()
			}
		}
	}, [queryKey, queryClient, enabled, watch, search])

	return useInfiniteQuery<
		PageResult,
		Error,
		PageResult,
		typeof queryKey,
		PageParameter
	>({
		queryKey,
		queryFn: async ({ pageParam }) =>
			fetchEventsPage({
				...pageParam,
				search
			}),
		initialPageParam: {
			startBlock: initialBlock,
			endBlock: null,
			range: DEFAULT_BLOCK_RANGE
		} as InitialPageParameter,
		getNextPageParam: (lastPage) => lastPage.nextCursor,
		enabled,
		staleTime: EVENTS_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})
}

/**
 * Hook to clear events cache
 */
export const useClearEventsCache = () => {
	const search = useFilterStore.use.search()
	const queryClient = useQueryClient()
	const { address } = useParams<{ address: string }>()

	return useCallback(() => {
		queryClient.removeQueries({
			queryKey: [CIRCLES_EVENTS_INFINITE_QUERY_KEY, search ?? address] as const
		})
	}, [search, queryClient, address])
}

/**
 * Hook to use events
 */
export const useEvents = (address: string | null = null): EventsQueryResult => {
	const eventTypes = useFilterStore.use.eventTypes()
	const search = useFilterStore.use.search()
	const { currentStartBlock } = useStartBlock()
	const updateStartBlock = useFilterStore.use.updateStartBlock()
	const blockNumber = useBlockNumber()

	// Use the infinite query
	const {
		data,
		isLoading: isEventsLoading,
		isFetchingNextPage: isLoadingMore,
		fetchNextPage,
		hasNextPage
	} = useEventsInfinite(
		currentStartBlock,
		Boolean(blockNumber),
		!search || isAddress(String(address)),
		isNil(search) || search === '' ? address : search
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

		return [...eventMap.values()]
	}, [data])

	// Get the updateEventTypesAmount function
	const updateEventTypesAmount = useFilterStore.use.updateEventTypesAmount()

	// Merge all eventTypesAmount maps from all pages
	useEffect(() => {
		if (!data) return

		const mergedEventTypes = new Map<CirclesEventType, number>()

		// Type-safe access to pages
		const { pages } = data as unknown as EventsInfiniteData

		const { finalStartBlock } = pages[pages.length - ONE]

		updateStartBlock(finalStartBlock)

		for (const page of pages) {
			for (const [type, count] of page.eventTypesAmount.entries()) {
				mergedEventTypes.set(type, (mergedEventTypes.get(type) ?? 0) + count)
			}
		}

		updateEventTypesAmount(mergedEventTypes)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data, updateEventTypesAmount, updateStartBlock])

	// Process and filter events
	const filteredEvents = useMemo(
		() => processEvents(allEvents, eventTypes),
		[allEvents, eventTypes]
	)

	// Load more events function
	const loadMoreEvents = useCallback(async () => {
		if (isLoadingMore || !hasNextPage) return

		logger.log('[Repository] Loading more events')

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

	return {
		events: filteredEvents,
		isEventsLoading,
		isLoadingMore,
		loadMoreEvents,
		hasMoreEvents: hasNextPage
	}
}
