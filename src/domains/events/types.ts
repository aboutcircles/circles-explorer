import type { CirclesEventType } from '@circles-sdk/data'
import type { Event, ProcessedEvent } from 'types/events'
import type { Address } from 'viem'

/**
 * Repository interface for events-related operations
 */
export interface EventsRepository {
	/**
	 * Get events for an address or search query
	 */
	getEvents: (
		address: Address | null,
		startBlock: number,
		endBlock: number | null,
		search?: string | null
	) => Promise<{
		events: Event[]
		eventTypesAmount: Map<CirclesEventType, number>
	}>

	/**
	 * Subscribe to events for an address
	 */
	subscribeToEvents: (address?: Address) => Promise<{
		subscribe: (callback: (event: unknown) => void) => () => void
	}>
}

/**
 * Result of an events query
 */
export interface EventsQueryResult {
	/**
	 * Processed events
	 */
	events: ProcessedEvent[]

	/**
	 * Whether events are loading
	 */
	isEventsLoading: boolean

	/**
	 * Whether more events are being loaded
	 */
	isLoadingMore: boolean

	/**
	 * Function to load more events
	 */
	loadMoreEvents: () => Promise<void>

	/**
	 * Whether there are more events to load
	 */
	hasMoreEvents: boolean
}

/**
 * Page parameter for infinite query
 */
export interface PageParameter {
	startBlock: number
	endBlock: number | null
	range: number
}

/**
 * Initial page parameter
 */
export interface InitialPageParameter {
	startBlock: number
	endBlock: null
	range: number
}

/**
 * Page result for infinite query
 */
export interface PageResult {
	events: Event[]
	eventTypesAmount: Map<CirclesEventType, number>
	finalRange: number
	finalStartBlock: number
	nextCursor?: PageParameter
}

/**
 * Infinite query data
 */
export interface EventsInfiniteData {
	pages: PageResult[]
	pageParams: unknown[]
}
