import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'

import { CIRCLES_INDEXER_URL } from 'constants/common'

import logger from 'services/logger'

export type EventType = 'CrcV1_HubTransfer' | 'CrcV1_Transfer' | 'CrcV1_Trust'

export interface BaseEventValues {
	blockNumber: string
	logIndex: string
	timestamp: string
	transactionHash: string
	transactionIndex: string
}

export interface HubTransferEventValues {
	amount: string
	from: string
	to: string
}

export interface TransferEventValues extends HubTransferEventValues {
	tokenAddress: string
}

export interface TrustEventValues {
	canSendTo: string
	limit: string
	user: string
}

export interface EventResponse {
	event: EventType
	values: BaseEventValues &
		(HubTransferEventValues | TransferEventValues | TrustEventValues)
}

export interface CirclesEventsResponse {
	result: EventResponse[]
}

export type Event = EventResponse['values'] & Pick<EventResponse, 'event'>

const FETCH_EVENTS_FROM_BLOCK = 30_282_299

// query
const CIRCLES_EVENTS_QUERY_KEY = 'circlesEvents'
export const useFetchCirclesEvents = (): UseQueryResult<Event[]> =>
	useQuery({
		queryKey: [CIRCLES_EVENTS_QUERY_KEY],
		queryFn: async () => {
			try {
				const response = await axios.post<CirclesEventsResponse>(
					CIRCLES_INDEXER_URL,
					{
						method: 'circles_events',
						params: [
							'0xde374ece6fa50e781e81aac78e811b33d16912c7',
							FETCH_EVENTS_FROM_BLOCK,
							null
						]
					}
				)

				const events = response.data.result.map((event) => ({
					...event,
					...event.values,
					key: `${event.values.blockNumber}-${event.values.transactionHash}-${event.values.logIndex}`
				}))

				console.log(response.data.result, { events })

				return events
			} catch {
				logger.error('[service][circles] Failed to query circles events')
				throw new Error('Failed to query circles events')
			}
		}
	})
