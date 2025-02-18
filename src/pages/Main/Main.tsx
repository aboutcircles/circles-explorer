import type { ReactElement } from 'react'
import { useEffect, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import type { Address } from 'viem'
import { isAddress } from 'viem'

import type { CirclesEventType } from '@circles-sdk/data'
import { EVENTS } from 'constants/events'
import { EventsTable } from 'shared/EventsTable'
import { Filter } from 'shared/Filter'
import { useFilterStore } from 'stores/useFilterStore'
import { AvatarSection } from './AvatarSection'
import { Stats } from './Stats'

export default function Main(): ReactElement {
	const location = useLocation()
	const [searchParameters] = useSearchParams()
	const updateEventTypes = useFilterStore.use.updateEventTypes()
	const updateSearch = useFilterStore.use.updateSearch()
	const eventTypes = useFilterStore.use.eventTypes()
	const syncWithUrl = useFilterStore.use.syncWithUrl()

	// Sync with URL parameters on mount
	useEffect(() => {
		syncWithUrl({
			search: searchParameters.get('search') ?? '',
			filter: searchParameters.get('filter') ?? ''
		})
	}, [searchParameters]) // eslint-disable-line react-hooks/exhaustive-deps

	// // Sync from URL on load
	// useEffect(() => {
	// 	const searchParameters = new URLSearchParams(location.search)
	// 	const searchQuery = searchParameters.get('search')
	// 	const filterParameter = searchParameters.get('filter')
	//
	// 	if (searchQuery) {
	// 		updateSearch(searchQuery)
	// 	}
	//
	// 	if (filterParameter) {
	// 		const selectedEvents = filterParameter.split(',') as CirclesEventType[]
	// 		// First, clear all events except the ones we want to keep
	// 		for (const event of EVENTS) {
	// 			if (eventTypes.has(event) && !selectedEvents.includes(event)) {
	// 				updateEventTypes(event)
	// 			}
	// 		}
	// 		// Then add any missing selected events
	// 		for (const event of selectedEvents) {
	// 			if (!eventTypes.has(event)) {
	// 				updateEventTypes(event)
	// 			}
	// 		}
	// 	}
	// }, [location.search, eventTypes]) // eslint-disable-line react-hooks/exhaustive-deps

	// it means avatar
	const { isSearchAddress, search } = useMemo(() => {
		const searchParameter = searchParameters.get('search') ?? ''

		console.log({ searchParameter })

		return {
			isSearchAddress: isAddress(searchParameter),
			search: searchParameter
		}
	}, [searchParameters])

	return (
		<div className='flex flex-col'>
			{isSearchAddress ? (
				<AvatarSection address={search as Address} />
			) : (
				<Stats />
			)}

			<div className='hidden sm:block'>
				<Filter />
			</div>

			<EventsTable address={isSearchAddress ? search : null} />
		</div>
	)
}
