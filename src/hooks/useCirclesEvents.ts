import { useEffect, useMemo } from 'react'

import { ONE } from 'constants/common'
import { useBlockNumber } from 'hooks/useBlockNumber'
import { useProfiles } from 'hooks/useProfiles'
import { useFetchCirclesEvents } from 'services/circlesIndex'
import { periods, useFilterStore } from 'stores/useFilterStore'
import type { Event } from 'types/events'
import { getDateRange } from 'utils/time'

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
			// Use type assertions to check if properties exist
			// These properties are added dynamically based on the event type
			if ('from' in event && event.from)
				addresses.push(String(event.from).toLowerCase())
			if ('to' in event && event.to)
				addresses.push(String(event.to).toLowerCase())
			if ('truster' in event && event.truster)
				addresses.push(String(event.truster).toLowerCase())
			if ('trustee' in event && event.trustee)
				addresses.push(String(event.trustee).toLowerCase())
			if ('canSendTo' in event && event.canSendTo)
				addresses.push(String(event.canSendTo).toLowerCase())
			if ('user' in event && event.user)
				addresses.push(String(event.user).toLowerCase())
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
