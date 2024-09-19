import dayjs from 'dayjs'

import { HOURS_IN_DAY } from 'constants/time'

export function getDateRange(daysBefore: number) {
	// Get the current date and time
	const now = dayjs()

	// Calculate the start date by subtracting the daysBefore value
	const startDate = now.subtract(daysBefore, 'day')

	// Calculate the end date which is 24 hours after the start date
	const endDate = startDate.add(HOURS_IN_DAY, 'hour')

	// Format the start and end dates as desired
	const startFormatted = startDate.format('MMM-DD HH:mm')
	const endFormatted = endDate.format('MMM-DD HH:mm')

	// Return the range as an object or a string
	return {
		start: startFormatted,
		end: endFormatted
	}
}
