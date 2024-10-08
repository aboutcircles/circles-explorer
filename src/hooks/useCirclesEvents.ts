import { useMemo } from 'react'

import { ONE } from 'constants/common'
import { useBlockNumber } from 'hooks/useBlockNumber'
import { useFetchCirclesEvents } from 'services/circlesIndex'
import { getDateRange } from 'utils/time'
import { useFilterStore, periods } from 'stores/useFilterStore'
import type { Event } from 'types/events'

export const useCirclesEvents = (page: number, address: string | null) => {
	const eventTypes = useFilterStore.use.eventTypes()
	const search = useFilterStore.use.search()
	const period = periods[useFilterStore.use.period()]

	const blockNumber = useBlockNumber()

	const dateRange = useMemo(
		() => getDateRange(page, period.value, period.unit),
		[period, page]
	)
	const startBlock = useMemo(
		() => (blockNumber ? Number(blockNumber) - page * period.blocks : 0),
		[period, page, blockNumber]
	)
	const endBlock = useMemo(
		() => startBlock + period.blocks,
		[period, startBlock]
	)

	const { data: events, isLoading: isEventsLoading } = useFetchCirclesEvents(
		startBlock,
		endBlock,
		Boolean(blockNumber),
		page === ONE,
		address
	)

	const filteredEvents = useMemo(() => {
		if (!events) return []

		const result = events.filter((event: Event): boolean =>
			eventTypes.has(event.event)
		)

		if (search) {
			return result.filter(
				(event: Event): boolean =>
					event.transactionHash.includes(search) ||
					event.event.includes(search) ||
					event.blockNumber.toString().includes(search)
			)
		}

		return result
	}, [events, eventTypes, search])

	return {
		events: filteredEvents,
		isEventsLoading,
		dateRange
	}
}
