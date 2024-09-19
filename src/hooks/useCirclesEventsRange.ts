import { useMemo } from 'react'
import { useBlockNumber } from 'wagmi'

import {
	BLOCK_TIME,
	HOURS_IN_DAY,
	MINUTES_IN_HOUR,
	SECONDS_IN_MINUTE
} from 'constants/time'
import { useFetchCirclesEvents } from 'services/circlesIndex'
import { getDateRange } from 'utils/time'
import { useFilterStore } from 'stores/useFilterStore'
import type { Event } from 'types/events'

const BLOCKS_IN_DAY =
	(HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE) / BLOCK_TIME

// 1 page - 1 day
export const useCirclesEventsRange = (page: number) => {
	const eventTypes = useFilterStore.use.eventTypes()

	const { data: blockNumber } = useBlockNumber({
		watch: false
	})

	const dateRange = getDateRange(page)
	const startBlock = blockNumber
		? Number(blockNumber) - page * BLOCKS_IN_DAY
		: 0
	const endBlock = startBlock + BLOCKS_IN_DAY

	const { data: events, isLoading: isEventsLoading } = useFetchCirclesEvents(
		startBlock,
		endBlock
	)

	const filteredEvents = useMemo(() => {
		if (!events) return []

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		return events.filter((event: Event): boolean => eventTypes.has(event.event))
	}, [events, eventTypes])

	return {
		events: filteredEvents,
		isEventsLoading,
		dateRange
	}
}
