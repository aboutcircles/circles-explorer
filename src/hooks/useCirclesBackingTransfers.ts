import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { formatUnits } from 'viem'

import { getSupportedToken } from 'constants/supportedTokens'
import logger from 'services/logger'
import { viemClient } from 'services/viemClient'

export interface ERC20Transfer {
	tokenAddress: Address
	tokenSymbol: string
	tokenDecimals: number
	tokenName: string
	tokenIcon: string
	from: Address
	to: Address
	amount: bigint
	formattedAmount: string
}

// Constants
const TRANSFER_EVENT_SIGNATURE =
	'0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const TOPIC_FROM_INDEX = 1
const TOPIC_TO_INDEX = 2
const ADDRESS_SLICE_START = 26
const MILLISECONDS_IN_SECOND = 1000
const SECONDS_IN_MINUTE = 60
const MINUTES_IN_HOUR = 60
const HOURS_IN_DAY = 24

// Cache time constants
const STALE_TIME = MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * MINUTES_IN_HOUR // 1 hour
const GC_TIME =
	MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY // 24 hours

export const useCirclesBackingTransfers = (transactionHash: string) =>
	useQuery({
		queryKey: ['circles_backing_transfers', transactionHash],
		queryFn: async (): Promise<ERC20Transfer[]> => {
			try {
				if (!transactionHash) {
					return []
				}

				// Get transaction receipt
				const receipt = await viemClient.getTransactionReceipt({
					hash: transactionHash as Address
				})

				const transfers: ERC20Transfer[] = []

				// Parse logs for Transfer events
				for (const log of receipt.logs) {
					try {
						// Check if this is a Transfer event
						if (log.topics[0] === TRANSFER_EVENT_SIGNATURE) {
							const tokenAddress = log.address
							const supportedToken = getSupportedToken(tokenAddress)

							// Only process supported tokens
							if (supportedToken) {
								const from = `0x${log.topics[TOPIC_FROM_INDEX]?.slice(ADDRESS_SLICE_START)}`
								const to = `0x${log.topics[TOPIC_TO_INDEX]?.slice(ADDRESS_SLICE_START)}`
								const amount = BigInt(log.data)

								const formattedAmount = formatUnits(
									amount,
									supportedToken.decimals
								)

								transfers.push({
									tokenAddress,
									tokenSymbol: supportedToken.symbol,
									tokenDecimals: supportedToken.decimals,
									tokenName: supportedToken.name,
									tokenIcon: supportedToken.icon,
									from,
									to,
									amount,
									formattedAmount
								} as ERC20Transfer)
							}
						}
					} catch (logError) {
						// Skip invalid logs
						logger.warn(
							'[useCirclesBackingTransfers] Failed to parse log',
							logError
						)
					}
				}

				return transfers
			} catch (error) {
				logger.error(
					'[useCirclesBackingTransfers] Failed to fetch transaction transfers',
					error
				)
				throw new Error('Failed to fetch transaction transfers')
			}
		},
		enabled: Boolean(transactionHash),
		staleTime: STALE_TIME, // 1 hour - transaction data doesn't change
		gcTime: GC_TIME // 24 hours
	})
