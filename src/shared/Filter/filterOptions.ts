import type { CirclesEventType } from '@circles-sdk/data'

import { LABELS_MAPPER } from 'constants/events'

import { ALIASES, FILTER_CATEGORIES } from './filterCategories'

export interface FilterOption {
	label: string
	value: string
	category: string
	count: number
	isAlias?: boolean
	events?: CirclesEventType[]
}

export const createFilterOptions = (
	eventTypesAmount: Map<CirclesEventType, number>
): FilterOption[] => {
	const options: FilterOption[] = []

	// Add alias options
	for (const [aliasName, events] of Object.entries(ALIASES)) {
		const totalCount = events.reduce(
			(sum, event) => sum + (eventTypesAmount.get(event) ?? 0),
			0
		)
		if (totalCount > 0) {
			options.push({
				label: `${aliasName} (${totalCount})`,
				value: `alias:${aliasName}`,
				category: 'Aliases',
				count: totalCount,
				isAlias: true,
				events
			})
		}
	}

	// Add regular event options grouped by category
	for (const category of FILTER_CATEGORIES) {
		if (category.key !== 'aliases') {
			// Process all categories except aliases (handled separately)
			for (const event of category.events) {
				const count = eventTypesAmount.get(event) ?? 0
				if (count > 0) {
					options.push({
						label: `${LABELS_MAPPER[event]} (${count})`,
						value: event,
						category: category.label,
						count
					})
				}
			}
		}
	}

	return options
}
