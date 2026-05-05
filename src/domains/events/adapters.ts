import type { CirclesEventType } from '@circles-sdk/data'
import type { Event, ProcessedEvent } from 'types/events'
import { isAddress, isHash } from 'viem'

const MIN_EVENTS_FOR_VIRTUAL_SUMMARY = 2

/**
 * Process events by grouping related events by transaction hash
 * and identifying summary events and their sub-events
 */
export const processEvents = (
	events: Event[],
	eventTypes: Set<CirclesEventType>,
	isTransactionPage = false
): ProcessedEvent[] => {
	if (events.length === 0) return []

	// Create a map to group events by transaction hash
	const eventsByTxHash = new Map<string, Event[]>()

	// First pass: collect all events by transaction hash
	for (const event of events) {
		if (eventTypes.has(event.event)) {
			const { transactionHash } = event
			const existingEvents = eventsByTxHash.get(transactionHash) ?? []
			eventsByTxHash.set(transactionHash, [...existingEvents, event])
		}
	}

	// Second pass: identify summary events and their sub-events
	const result: ProcessedEvent[] = []

	for (const eventGroup of eventsByTxHash.values()) {
		// Check if there's a summary event in this transaction
		const summaryEvent = eventGroup.find(
			(event) =>
				event.event === 'CrcV1_TransferSummary' ||
				event.event === 'CrcV2_TransferSummary'
		)

		if (summaryEvent && !isTransactionPage) {
			// For main/avatar pages: show summary event with link to transaction details
			// Include subEvents for potential future use
			const subEvents = eventGroup.filter((event) => event !== summaryEvent)
			const processedEvent: ProcessedEvent = {
				...summaryEvent,
				isExpandable: false,
				subEvents
			}
			result.push(processedEvent)
		} else if (
			!isTransactionPage &&
			eventGroup.length >= MIN_EVENTS_FOR_VIRTUAL_SUMMARY
		) {
			// Create virtual summary event for multiple events in same transaction (no real summary exists)
			const [firstEvent] = eventGroup
			const virtualSummaryEvent: ProcessedEvent = {
				...firstEvent,
				event: 'CrcV2_TransferSummary' as CirclesEventType,
				isExpandable: false,
				subEvents: eventGroup,
				key: `${firstEvent.transactionHash}-virtual-summary`
			}
			result.push(virtualSummaryEvent)
		} else {
			// For transaction pages: skip summary events, show all individual events
			// For main/avatar pages without summary: show all events individually
			const eventsToProcess = isTransactionPage
				? eventGroup.filter(
						(event) =>
							event.event !== 'CrcV1_TransferSummary' &&
							event.event !== 'CrcV2_TransferSummary'
					)
				: eventGroup

			for (const event of eventsToProcess) {
				const processedEvent: ProcessedEvent = {
					...event,
					isExpandable: false,
					subEvents: []
				}
				result.push(processedEvent)
			}
		}
	}

	return result
}

/**
 * Get a unique key for an event based on transaction hash and log index
 */
export const getEventKey = (
	transactionHash: string,
	logIndex: number
): string => `${transactionHash}-${logIndex}`

export const defineFiltersFromSearch = (search: string | null) => {
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
