import { useCallback } from 'react'
import type React from 'react'
import { isAddress } from 'viem'

import { Search } from 'components/Search'
import { FilterCheckBox } from 'components/FilterCheckBox'
import { EVENTS } from 'constants/events'
import { useFilterStore } from 'stores/useFilterStore'

export function Filter(): React.ReactElement {
	const eventTypes = useFilterStore.use.eventTypes()
	const updateSearch = useFilterStore.use.updateSearch()
	const updateEventTypes = useFilterStore.use.updateEventTypes()
	const eventTypesAmount = useFilterStore.use.eventTypesAmount()

	const handleSubmit = useCallback(
		(search: string) => {
			if (!isAddress(search)) return

			updateSearch(search)
		},
		[updateSearch]
	)

	return (
		<div>
			<div className='m-4 flex justify-center'>
				<Search placeholder='0x...' handleSubmit={handleSubmit} />
			</div>

			<div className='m-4 flex flex-row flex-wrap justify-center'>
				{EVENTS.map((event) => {
					const eventAmount = eventTypesAmount.get(event) ?? 0

					if (eventAmount === 0) return null

					return (
						<FilterCheckBox
							handleChange={() => updateEventTypes(event)}
							isDefaultSelected={eventTypes.has(event)}
							className='mr-1'
							key={event}
							label={`${event} (${eventAmount})`}
						/>
					)
				})}
			</div>
		</div>
	)
}
