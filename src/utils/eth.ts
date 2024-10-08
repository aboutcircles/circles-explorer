import { DEAD_ADDRESS } from 'constants/common'

const FIRST_PART = 1
const SECOND_PART = 2

const SKIP_HASH_SYMBOLS = 4

const getTruncateRegex = (number_: number) =>
	`^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{${number_}})$`

export const truncate = (hash: string, number_: number) => {
	const regex = new RegExp(getTruncateRegex(number_))
	const match = hash.match(regex)
	if (!match) return hash
	return `${match[FIRST_PART]}…${match[SECOND_PART]}`
}

export const truncateHex = (hash: string) => truncate(hash, SKIP_HASH_SYMBOLS)

export const isDeadAddress = (address: string) => address === DEAD_ADDRESS
