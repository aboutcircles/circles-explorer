import { useMemo, useEffect } from 'react'

import { ONE } from 'constants/common'
import { useBlockNumber } from 'hooks/useBlockNumber'
import { useFetchCirclesEvents } from 'services/circlesIndex'
import { getDateRange } from 'utils/time'
import { useFilterStore, periods } from 'stores/useFilterStore'
import { useSearchStore } from 'stores/useSearchStore'
import type { Event } from 'types/events'

export const useCirclesEvents = (page: number) => {
	const eventTypes = useFilterStore.use.eventTypes()
	const search = useSearchStore.use.search()
	const updateEventTypesAmount = useFilterStore.use.updateEventTypesAmount()
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

	const {
		data: { events, eventTypesAmount } = {},
		isLoading: isEventsLoading
	} = useFetchCirclesEvents(
		startBlock,
		endBlock,
		Boolean(blockNumber),
		page === ONE && !search,
		search
	)

	useEffect(() => {
		if (eventTypesAmount) {
			updateEventTypesAmount(eventTypesAmount)
		}
	}, [updateEventTypesAmount, eventTypesAmount])

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
