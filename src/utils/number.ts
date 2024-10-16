import { ONE } from 'constants/common'

/* eslint-disable @typescript-eslint/no-magic-numbers */
export const prettifyNumber = (number: number) => {
	if (number >= 1_000_000_000) {
		return `${(number / 1_000_000_000).toFixed(ONE)}B` // Billion
	}
	if (number >= 1_000_000) {
		return `${(number / 1_000_000).toFixed(ONE)}M` // Million
	}
	if (number >= 1000) {
		return `${(number / 1000).toFixed(ONE)}K` // Thousand
	}
	return number.toString() // Less than thousand
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
