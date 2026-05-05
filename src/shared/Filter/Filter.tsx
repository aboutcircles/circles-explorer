import type { CirclesEventType } from '@circles-sdk/data'
import cn from 'classnames'
import type React from 'react'
import { useCallback, useMemo } from 'react'
import { TagPicker } from 'rsuite'

import { FilterCheckBox } from 'components/FilterCheckBox'
import RsuiteStyleProvider from 'components/RsuiteStyleProvider'
import { DEFAULT_FILTER_EVENTS, EVENTS } from 'constants/events'
import { useFilterStore } from 'stores/useFilterStore'

import { createFilterOptions, type FilterOption } from './filterOptions'

const DROPDOWN_Z_INDEX = 1000

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
	const isDefaultSelected = useMemo(() => {
		if (eventTypes.size !== DEFAULT_FILTER_EVENTS.length) return false
		return DEFAULT_FILTER_EVENTS.every((event) => eventTypes.has(event))
	}, [eventTypes])

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
			<div className='my-3'>
				<div className='flex items-center justify-between'>
					<div className='text-xl font-bold'>Filter Transaction Types:</div>
				</div>

				<div className='flex items-center'>
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
						renderValue={() => (
							<span className='p-2 text-sm text-gray-500'>
								Filter Events ({selectedValues.length} selected)
							</span>
						)}
						className={cn(
							className,
							'min-w-[140px] rounded-md border border-gray-300 bg-white'
						)}
						groupBy='category'
						style={{
							minHeight: '2.5rem',
							maxHeight: '80px',
							overflow: 'visible'
						}}
						menuStyle={{
							zIndex: DROPDOWN_Z_INDEX,
							maxHeight: '300px',
							border: '1px solid #e5e7eb',
							borderRadius: '0.5rem',
							boxShadow:
								'0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
						}}
					/>

					<FilterCheckBox
						handleChange={toggleAllEvents}
						isDefaultSelected={isAllSelected}
						className='ml-2'
						label={
							isDefaultSelected
								? 'Select All'
								: isAllSelected
									? 'Clear All'
									: 'Reset to Default'
						}
					/>
				</div>
			</div>
		</RsuiteStyleProvider>
	)
}

Filter.defaultProps = {
	className: ''
}
