import { useEffect, useMemo } from 'react'

import { ONE } from 'constants/common'
import { useBlockNumber } from 'hooks/useBlockNumber'
import { useProfiles } from 'hooks/useProfiles'
import { useFetchCirclesEvents } from 'services/circlesIndex'
import { periods, useFilterStore } from 'stores/useFilterStore'
import type { Event } from 'types/events'
import { getDateRange } from 'utils/time'
import { avatarFields } from 'constants/avatarFields'

export const useCirclesEvents = (page: number) => {
	const eventTypes = useFilterStore.use.eventTypes()
	const search = useFilterStore.use.search()
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

	// Prefetch profiles for all addresses in the events
	const { fetchProfiles } = useProfiles()

	useEffect(() => {
		if (filteredEvents.length === 0) return

		// Extract all addresses from events
		const addresses: string[] = []
		for (const event of filteredEvents) {
			// Check if the event has the avatar field
			for (const field of avatarFields) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				if (field in event && event[field]) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					addresses.push(String(event[field]).toLowerCase())
				}
			}
		}

		if (addresses.length > 0) {
			void fetchProfiles(addresses)
		}
	}, [filteredEvents, fetchProfiles])

	return {
		events: filteredEvents,
		isEventsLoading,
		dateRange
	}
}
