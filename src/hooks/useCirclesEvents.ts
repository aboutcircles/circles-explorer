import { useMemo } from 'react'
import { useBlockNumber } from 'wagmi'

import { ONE } from 'constants/common'
import { useFetchCirclesEvents } from 'services/circlesIndex'
import { getDateRange } from 'utils/time'
import { useFilterStore, periods } from 'stores/useFilterStore'
import type { Event } from 'types/events'

export const useCirclesEvents = (page: number) => {
	const eventTypes = useFilterStore.use.eventTypes()
	const period = periods[useFilterStore.use.period()]

	const { data: blockNumber } = useBlockNumber({
		watch: false
	})

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
		page === ONE
	)

	const filteredEvents = useMemo(() => {
		if (!events) return []

		return events.filter((event: Event): boolean => eventTypes.has(event.event))
	}, [events, eventTypes])

	return {
		events: filteredEvents,
		isEventsLoading,
		dateRange
	}
}
