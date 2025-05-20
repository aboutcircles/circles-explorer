/**
 * Bot detection types
 */

import type { Address } from 'viem'

/**
 * Bot verdict from the API
 */
export interface BotVerdict {
	address: string
	is_bot: boolean
	category: string | null
	reason: string | null
}

/**
 * API response structure
 */
export interface BotApiResponse {
	verdicts: BotVerdict[]
}

/**
 * Map of addresses to bot verdicts
 */
export type BotVerdictMap = Record<string, BotVerdict | null>

/**
 * Parameters for bot detection API
 */
export interface BotDetectionParameters {
	addresses: Address[]
}
