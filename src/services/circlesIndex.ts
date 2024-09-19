import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'

import { CIRCLES_INDEXER_URL } from 'constants/common'
import type { CirclesEventsResponse } from 'types/events'
import logger from 'services/logger'

// const FETCH_EVENTS_FROM_BLOCK = 30_282_299
const FETCH_EVENTS_FROM_BLOCK = 35_068_365

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

				logger.log(response.data.result, { events })

				return events
			} catch {
				logger.error('[service][circles] Failed to query circles events')
				throw new Error('Failed to query circles events')
			}
		}
	})
