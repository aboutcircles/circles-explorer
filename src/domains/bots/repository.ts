import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import type { Address } from 'viem'

import { MILLISECONDS_IN_A_MINUTE } from 'constants/time'
import logger from 'services/logger'

import type { BotApiResponse, BotVerdict, BotVerdictMap } from './types'

// API endpoint for bot detection
const BOT_API_URL =
	'https://squid-app-3gxnl.ondigitalocean.app/aboutcircles-advanced-analytics2/bot-analytics/classify'

// Cache time constants
const BOT_CACHE_MINUTES = 30

// Query keys
export const botKeys = {
	all: ['bots'] as const,
	detail: (id: string) => [...botKeys.all, id] as const,
	batch: (ids: string[]) =>
		[...botKeys.all, 'batch', ids.sort().join(',')] as const
}

// Repository methods
export const botRepository = {
	// Get bot verdicts for multiple addresses
	getBotVerdicts: async (addresses: Address[]): Promise<BotVerdictMap> => {
		try {
			if (addresses.length === 0) return {}

			// Create result map
			const verdictMap: BotVerdictMap = {}

			// Make API request
			const response = await axios.post<BotApiResponse>(BOT_API_URL, {
				addresses: addresses.map((addr) => addr.toLowerCase())
			})

			// Process results
			for (const verdict of response.data.verdicts) {
				verdictMap[verdict.address.toLowerCase()] = verdict
			}

			// Mark addresses not found as null
			for (const address of addresses) {
				const lowercaseAddress = address.toLowerCase()
				if (!verdictMap[lowercaseAddress]) {
					verdictMap[lowercaseAddress] = null
				}
			}

			logger.log('[Repository] Fetched bot verdicts:', {
				addressCount: addresses.length,
				resultCount: Object.keys(verdictMap).length
			})

			return verdictMap
		} catch (error) {
			logger.error('[Repository] Failed to fetch bot verdicts:', error)
			throw new Error('Failed to fetch bot verdicts')
		}
	},

	// Get bot verdict for a single address
	getBotVerdict: async (address: Address): Promise<BotVerdict | null> => {
		try {
			const verdicts = await botRepository.getBotVerdicts([address])
			return verdicts[address.toLowerCase()] ?? null
		} catch (error) {
			logger.error('[Repository] Failed to fetch bot verdict:', error)
			throw new Error('Failed to fetch bot verdict')
		}
	}
}

// React Query hooks
export const useBotVerdicts = (addresses: Address[] = []) =>
	useQuery({
		queryKey: botKeys.batch(addresses.map((a) => a.toLowerCase())),
		queryFn: async () => {
			if (addresses.length === 0) return {}
			return botRepository.getBotVerdicts(addresses)
		},
		enabled: addresses.length > 0,
		staleTime: BOT_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})

export const useBotVerdict = (address?: Address) =>
	useQuery({
		queryKey: botKeys.detail(address?.toLowerCase() ?? ''),
		queryFn: async () => {
			if (!address) throw new Error('Address is required')
			return botRepository.getBotVerdict(address)
		},
		enabled: !!address,
		staleTime: BOT_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})
