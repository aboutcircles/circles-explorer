import { useCallback, useMemo } from 'react'
import type { CirclesEventType } from '@circles-sdk/data'
import type {
	QueryClient,
	QueryKey,
	UseInfiniteQueryResult,
	InfiniteData
} from '@tanstack/react-query'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { type Address, type Hex, hexToNumber, isAddress, isHash } from 'viem'
import { CIRCLES_INDEXER_URL, MINUS_ONE, ONE } from 'constants/common'
import { useFilterStore } from 'stores/useFilterStore'
import type { CirclesEventsResponse, Event } from 'types/events'
import {
	DEFAULT_BLOCK_RANGE,
	MAX_BLOCK_RANGE,
	MAX_RETRY_COUNT,
	RANGE_MULTIPLIER,
	RETRY_INCREMENT
} from 'constants/blockRange'
import { circlesData } from './circlesData'
import logger from './logger'

const getEventKey = (transactionHash: string, logIndex: number) =>
	`${transactionHash}-${logIndex}`

const defineFiltersFromSearch = (search: string | null) => {
	if (!search || isAddress(search)) return null

	if (isHash(search)) {
		return [
			{
				Type: 'FilterPredicate',
				FilterType: 'In',
				Column: 'transactionHash',
				Value: [search]
			}
		]
	}

	// todo: fix this, getting server error now
	if (Number.isInteger(Number(search))) {
		return [
			{
				Type: 'FilterPredicate',
				FilterType: 'In',
				Column: 'blockNumber',
				Value: [Number(search)]
			}
		]
	}

	return null
}

// watcher
const watchEventUpdates = async (
	queryKey: QueryKey,
	queryClient: QueryClient,
	address: string | null
) => {
	const avatarEvents = await (address
		? circlesData.subscribeToEvents(address as Address)
		: circlesData.subscribeToEvents())

	console.log('subsctibe')
	avatarEvents.subscribe((event) => {
		const key = getEventKey(
			event.transactionHash ?? `${event.blockNumber}-${event.transactionIndex}`,
			event.logIndex
		)

		queryClient.setQueryData(queryKey, (cacheData?: EventsInfiniteData) => {
			if (!cacheData)
				return [
					{
						events: [event]
					}
				]

			console.log({ cacheData })

			const updatedData = [
				...cacheData.pages[cacheData.pages.length - ONE].events
			]

			const eventIndex = updatedData.findIndex(
				(cacheEvent) => cacheEvent.key === key
			)

			if (eventIndex === MINUS_ONE) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				updatedData.unshift({
					...event,
					key,
					event: event.$event
				})
			}

			return {
				...cacheData,
				events: updatedData
			}
		})
	})
}

// Helper function to fetch events
const fetchEvents = async (
	startBlock: number,
	endBlock: number | null,
	search: string | null
): Promise<{
	events: Event[]
	eventTypesAmount: Map<CirclesEventType, number>
}> => {
	try {
		const address = isAddress(search ?? '') ? search : null
		const filters = address ? null : defineFiltersFromSearch(search)

		const response = await axios.post<CirclesEventsResponse>(
			CIRCLES_INDEXER_URL,
			{
				method: 'circles_events',
				params: filters
					? [null, 0, null, null, filters]
					: [address, startBlock, endBlock]
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
			'[service][circles] queried circles events',
			`Event count: ${events.length}, startBlock: ${startBlock}, endBlock: ${endBlock}`
		)

		return { events, eventTypesAmount }
	} catch (error) {
		logger.error('[service][circles] Failed to query circles events', error)
		throw new Error('Failed to query circles events')
	}
}

// Define the page parameter interface for infinite query
interface PageParameter {
	startBlock: number
	endBlock: number | null
	range: number
}

// Define the initial page parameter type
interface InitialPageParameter {
	startBlock: number
	endBlock: null
	range: number
}

// Define the page result interface
interface PageResult {
	events: Event[]
	eventTypesAmount: Map<CirclesEventType, number>
	finalRange: number
	finalStartBlock: number
	nextCursor?: PageParameter
}

// Type for the infinite query data
export type EventsInfiniteData = InfiniteData<PageResult>

// Helper function to fetch a page of events with retry logic
const fetchEventsPage = async ({
	startBlock,
	endBlock,
	range,
	search,
	watch,
	queryKey,
	queryClient
}: PageParameter & {
	search: string | null
	watch: boolean
	queryKey: QueryKey
	queryClient: QueryClient
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
		const response = await fetchEvents(
			currentStartBlock,
			currentEndBlock,
			search
		)
		const newEventCount = response.events.length
		logger.log(`${currentStartBlock} - ${currentEndBlock} - ${newEventCount}`)

		// Success case: found events
		if (newEventCount > 0) {
			// If we found events, set up watch if needed
			if (watch) {
				void watchEventUpdates(
					queryKey,
					queryClient,
					isAddress(search ?? '') ? search : null
				)
			}

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
			`[service][circles] Expanded range to ${nextRange} blocks (try ${tryCount})`
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

// Infinite query for circles events
const CIRCLES_EVENTS_INFINITE_QUERY_KEY = 'circlesEventsInfinite'

export const useClearEventsCache = () => {
	const search = useFilterStore.use.search()
	const queryClient: QueryClient = useQueryClient()

	return useCallback(() => {
		queryClient.removeQueries({
			queryKey: [CIRCLES_EVENTS_INFINITE_QUERY_KEY, search]
		})
	}, [search, queryClient])
}

export const useFetchCirclesEventsInfinite = (
	initialBlock: number,
	enabled: boolean,
	watch: boolean,
	search: string | null
): UseInfiniteQueryResult<PageResult> => {
	const queryClient: QueryClient = useQueryClient()

	// Query key only depends on search parameter
	const queryKey = useMemo(
		() => [CIRCLES_EVENTS_INFINITE_QUERY_KEY, search],
		[search]
	)

	return useInfiniteQuery<
		PageResult,
		Error,
		PageResult,
		QueryKey,
		PageParameter
	>({
		queryKey,
		queryFn: async ({ pageParam }) =>
			fetchEventsPage({
				...pageParam,
				search,
				watch,
				queryKey,
				queryClient
			}),
		initialPageParam: {
			startBlock: initialBlock,
			endBlock: null,
			range: DEFAULT_BLOCK_RANGE
		} as InitialPageParameter,
		getNextPageParam: (lastPage) => lastPage.nextCursor,
		enabled
	})
}
