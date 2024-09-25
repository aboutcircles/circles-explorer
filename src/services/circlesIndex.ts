import { useMemo } from 'react'
import axios from 'axios'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type {
	UseQueryResult,
	QueryClient,
	QueryKey
} from '@tanstack/react-query'

import { CIRCLES_INDEXER_URL, MINUS_ONE } from 'constants/common'
import type { CirclesEventsResponse, Event } from 'types/events'
import logger from 'services/logger'
import type { Sdk } from 'providers/CirclesSdkProvider'
import { useCirclesSdk } from 'providers/CirclesSdkProvider'

const getEventKey = (transactionHash: string, logIndex: number) =>
	`${transactionHash}-${logIndex}`

// watcher
const watchEventUpdates = async (
	sdk: Sdk,
	queryKey: QueryKey,
	queryClient: QueryClient
) => {
	const avatarEvents = await sdk.data.subscribeToEvents()

	avatarEvents.subscribe((event) => {
		const key = getEventKey(
			event.transactionHash ?? `${event.blockNumber}-${event.transactionIndex}`,
			event.logIndex
		)

		queryClient.setQueryData(queryKey, (cacheData?: Event[]) => {
			logger.log({ event, key, cacheData })

			if (!cacheData) return [event]

			const updatedData = [...cacheData]

			const eventIndex = updatedData.findIndex(
				(cacheEvent) => cacheEvent.key === key
			)

			if (eventIndex === MINUS_ONE) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				updatedData.unshift({
					...event,
					key,
					event: event.$event
				})
			}

			return updatedData
		})
	})
}

// query
const CIRCLES_EVENTS_QUERY_KEY = 'circlesEvents'
export const useFetchCirclesEvents = (
	startBlock: number,
	endBlock: number,
	enabled: boolean,
	watch: boolean
): UseQueryResult<Event[]> => {
	const { sdk } = useCirclesSdk()
	const queryClient: QueryClient = useQueryClient()

	const queryKey = useMemo(
		() => [CIRCLES_EVENTS_QUERY_KEY, startBlock, endBlock],
		[startBlock, endBlock]
	)

	return useQuery({
		queryKey,
		queryFn: async () => {
			try {
				const response = await axios.post<CirclesEventsResponse>(
					CIRCLES_INDEXER_URL,
					{
						method: 'circles_events',
						params: [
							// '0xde374ece6fa50e781e81aac78e811b33d16912c7',
							null,
							startBlock,
							endBlock
						]
					}
				)

				if (watch && sdk) {
					void watchEventUpdates(sdk, queryKey, queryClient)
				}

				const events = response.data.result.map((event) => ({
					...event,
					...event.values,
					key: getEventKey(
						event.values.transactionHash,
						Number(event.values.logIndex)
					)
				}))

				logger.log(response.data.result, { events })

				return events
			} catch {
				logger.error('[service][circles] Failed to query circles events')
				throw new Error('Failed to query circles events')
			}
		},
		enabled: Boolean(sdk) && enabled
	})
}
