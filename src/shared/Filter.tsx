import type React from 'react'

import { FilterCheckBox } from 'components/FilterCheckBox'
import { V1_EVENTS, V2_EVENTS, LABELS_MAPPER } from 'constants/events'
import { useFilterStore } from 'stores/useFilterStore'

const filters = [
	{
		label: 'Circles V1:',
		events: V1_EVENTS,
		key: 'V1'
	},
	{
		label: 'Circles V2:',
		events: V2_EVENTS,
		key: 'V2'
	}
]

export function Filter(): React.ReactElement | null {
	const eventTypes = useFilterStore.use.eventTypes()
	const updateEventTypes = useFilterStore.use.updateEventTypes()
	const eventTypesAmount = useFilterStore.use.eventTypesAmount()

	if (eventTypesAmount.size === 0) return null

	return (
		<div className='m-4 flex flex-col flex-wrap justify-center'>
			<div className='flex text-xl font-bold'>Filter Transaction Types:</div>

			{filters.map(({ label, events }) => (
				<div className='flex flex-row flex-wrap items-center' key={label}>
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
			))}
		</div>
	)
}
