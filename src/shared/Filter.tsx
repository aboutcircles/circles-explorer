import type React from 'react'

import type { CirclesEventType } from '@circles-sdk/data'
import { FilterCheckBox } from 'components/FilterCheckBox'
import { EVENTS, LABELS_MAPPER, V1_EVENTS, V2_EVENTS } from 'constants/events'
import { useMemo } from 'react'
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
	const toggleAllEvents = useFilterStore.use.toggleAllEvents()

	const hasAnyEvents = useMemo(
		() =>
			filters.some(({ events }) =>
				events.some((event) => (eventTypesAmount.get(event) ?? 0) > 0)
			),
		[eventTypesAmount]
	)

	const hasVisibleEvents = useMemo(
		() => (events: CirclesEventType[]) =>
			events.some((event) => (eventTypesAmount.get(event) ?? 0) > 0),
		[eventTypesAmount]
	)

	const isAllSelected = eventTypes.size === EVENTS.length

	if (!hasAnyEvents) return null

	return (
		<div className='m-4 flex flex-col flex-wrap justify-center'>
			<div className='mb-2 flex items-center justify-between'>
				<div className='text-xl font-bold'>Filter Transaction Types:</div>
				<FilterCheckBox
					handleChange={toggleAllEvents}
					isDefaultSelected={isAllSelected}
					className='mr-1'
					label={isAllSelected ? 'Clear All' : 'Select All'}
				/>
			</div>

			{filters.map(
				({ label, events }) =>
					hasVisibleEvents(events) && (
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
					)
			)}
		</div>
	)
}
