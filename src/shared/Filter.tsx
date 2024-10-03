import type React from 'react'

import { FilterCheckBox } from 'components/FilterCheckBox'
import { EVENTS } from 'constants/events'
import { useFilterStore } from 'stores/useFilterStore'

export function Filter(): React.ReactElement {
	const eventTypes = useFilterStore.use.eventTypes()
	const updateEventTypes = useFilterStore.use.updateEventTypes()
	const eventTypesAmount = useFilterStore.use.eventTypesAmount()

	return (
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
	)
}
