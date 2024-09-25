import type { ManipulateType } from 'dayjs'
import dayjs from 'dayjs'

export function getDateRange(
	unitsBefore: number,
	unitsAmount: number,
	unit = 'day'
) {
	// Get the current date and time
	const now = dayjs()

	// Calculate the start date by subtracting the daysBefore value
	const startDate = now.subtract(
		unitsBefore * unitsAmount,
		unit as ManipulateType
	)

	// Calculate the end date which is unitsAmount unit after the start date
	const endDate = startDate.add(unitsAmount, unit as ManipulateType)

	// Format the start and end dates as desired
	const startFormatted = startDate.format('MMM-DD HH:mm')
	const endFormatted = endDate.format('MMM-DD HH:mm')

	// Return the range as an object or a string
	return {
		start: startFormatted,
		end: endFormatted
	}
}
