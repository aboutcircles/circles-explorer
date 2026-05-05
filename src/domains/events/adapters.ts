import type { CirclesEventType } from 'types/events'
import { avatarFields } from 'constants/avatarFields'
import type { Event, ProcessedEvent } from 'types/events'
import { isAddress, isHash } from 'viem'

const MIN_EVENTS_FOR_VIRTUAL_SUMMARY = 2

const eventInvolves = (event: Event, lowerAddress: string): boolean => {
	const record = event as unknown as Record<string, unknown>
	for (const field of avatarFields) {
		const value = record[field]
		if (typeof value === 'string' && value.toLowerCase() === lowerAddress) {
			return true
		}
	}
	return false
}

const eventHasParticipantField = (event: Event): boolean => {
	const record = event as unknown as Record<string, unknown>
	for (const field of avatarFields) {
		if (typeof record[field] === 'string') return true
	}
	return false
}

/**
 * Process events by grouping related events by transaction hash
 * and identifying summary events and their sub-events.
 *
 * When `address` is provided (avatar profile pages), drop tx groups whose
 * events have no participant overlap with the address. Required because the
 * indexer's `circles_events(address, ...)` over-returns flow-scope events
 * from unrelated transactions.
 */
export const processEvents = (
	events: Event[],
	eventTypes: Set<CirclesEventType>,
	isTransactionPage = false,
	address: string | null = null
): ProcessedEvent[] => {
	if (events.length === 0) return []

	const lowerAddress = address?.toLowerCase() ?? null

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
		// Avatar-scoped pages: drop tx groups that don't involve this avatar.
		if (
			lowerAddress &&
			!eventGroup.some((event) => eventInvolves(event, lowerAddress))
		) {
			continue
		}

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
			// Pick a template with participant fields so the summary row renders
			// avatars instead of "No participants" when the first event happens
			// to be a flow-scope event with no `from`/`to`/`avatar`/etc.
			const summaryTemplate =
				eventGroup.find((event) => eventHasParticipantField(event)) ??
				eventGroup[0]
			const virtualSummaryEvent: ProcessedEvent = {
				...summaryTemplate,
				event: 'CrcV2_TransferSummary' as CirclesEventType,
				isExpandable: false,
				subEvents: eventGroup,
				key: `${summaryTemplate.transactionHash}-virtual-summary`
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
