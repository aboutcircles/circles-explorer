import type React from 'react'
import type { CirclesEventType } from '@circles-sdk/data'

import { FilterCheckBox } from 'components/FilterCheckBox'
import { V1_EVENTS, V2_EVENTS, LABELS_MAPPER } from 'constants/events'
import { useFilterStore } from 'stores/useFilterStore'

const renderFilters = (label: string, events: CirclesEventType[]) => {
	const eventTypes = useFilterStore.use.eventTypes()
	const updateEventTypes = useFilterStore.use.updateEventTypes()
	const eventTypesAmount = useFilterStore.use.eventTypesAmount()

	return (
		<div className='flex flex-row flex-wrap items-center'>
			<span className='mr-2 text-sm font-bold'>{label}</span>
			{events.map((event) => {
				const eventAmount = eventTypesAmount.get(event) ?? 0

				if (eventAmount === 0) return null

				return (
					<FilterCheckBox
						handleChange={() => updateEventTypes(event)}
						isDefaultSelected={eventTypes.has(event)}
						className='mr-1'
						key={event}
						label={`${LABELS_MAPPER[event]} (${eventAmount})`}
					/>
				)
			})}
		</div>
	)
}

export function Filter(): React.ReactElement {
	return (
		<div className='m-4 flex flex-col flex-wrap justify-center'>
			<div className='flex text-xl font-bold'>Filter Transaction Types:</div>

			{renderFilters('Circles V1:', V1_EVENTS)}
			{renderFilters('Circles V2:', V2_EVENTS)}
		</div>
	)
}
