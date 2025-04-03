import type React from 'react'
import cn from 'classnames'
import { useCallback, useMemo } from 'react'
import { TagPicker } from 'rsuite'
import type { CirclesEventType } from '@circles-sdk/data'

import RsuiteStyleProvider from 'components/RsuiteStyleProvider'
import { EVENTS } from 'constants/events'
import { useFilterStore } from 'stores/useFilterStore'
import { FilterCheckBox } from 'components/FilterCheckBox'

import { createFilterOptions, type FilterOption } from './filterOptions'

export function Filter({
	className
}: {
	className?: string
}): React.ReactElement | null {
	const eventTypes = useFilterStore.use.eventTypes()
	const updateEventTypes = useFilterStore.use.updateEventTypes()
	const updateEventTypesBatch = useFilterStore.use.updateEventTypesBatch()
	const eventTypesAmount = useFilterStore.use.eventTypesAmount()
	const toggleAllEvents = useFilterStore.use.toggleAllEvents()

	const isAllSelected = eventTypes.size === EVENTS.length

	const filterOptions = useMemo(
		() => createFilterOptions(eventTypesAmount),
		[eventTypesAmount]
	)

	const hasAnyEvents = filterOptions.length > 0

	const selectedValues = useMemo(() => {
		const selectedEvents = new Set(eventTypes)
		const selectedOptions = filterOptions.filter((option) => {
			if (option.isAlias) {
				// Select alias if all its events are selected
				return option.events?.every((event) => selectedEvents.has(event))
			}
			return selectedEvents.has(option.value as CirclesEventType)
		})
		return selectedOptions.map((option) => option.value)
	}, [eventTypes, filterOptions])

	const handleChange = useCallback(
		(tag: string) => {
			updateEventTypes(tag as CirclesEventType)
		},
		[updateEventTypes]
	)

	const handleSelect = useCallback(
		(value: string[], item: FilterOption) => {
			if (item.isAlias) {
				// update event types for alias
				updateEventTypesBatch(item.events ?? [])
			} else {
				updateEventTypes(item.value as CirclesEventType)
			}
		},
		[updateEventTypes, updateEventTypesBatch]
	)

	if (!hasAnyEvents) return null

	return (
		<RsuiteStyleProvider>
			<div className='m-4'>
				<div className='mb-2 flex items-center justify-between'>
					<div className='text-xl font-bold'>Filter Transaction Types:</div>
					<FilterCheckBox
						handleChange={toggleAllEvents}
						isDefaultSelected={isAllSelected}
						className='mr-1'
						label={isAllSelected ? 'Clear All' : 'Select All'}
					/>
				</div>

				<div className='mt-4'>
					<TagPicker
						data={filterOptions}
						value={selectedValues}
						placeholder='Select filters'
						onTagRemove={handleChange}
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-expect-error
						onSelect={handleSelect}
						searchable
						onClean={toggleAllEvents}
						className={cn(
							className,
							'min-w-[140px] overflow-scroll rounded-md'
						)}
						groupBy='category'
					/>
				</div>
			</div>
		</RsuiteStyleProvider>
	)
}

Filter.defaultProps = {
	className: ''
}
