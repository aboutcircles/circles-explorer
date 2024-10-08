import { useMemo } from 'react'
import axios from 'axios'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { CirclesEventType } from '@circles-sdk/data'
import type {
	UseQueryResult,
	QueryClient,
	QueryKey
} from '@tanstack/react-query'
import { hexToNumber } from 'viem'
import type { Hex } from 'viem'

import { CIRCLES_INDEXER_URL, MINUS_ONE, ONE } from 'constants/common'
import type { CirclesEventsResponse, Event } from 'types/events'
import type { StatsResponse } from 'types/stats'
import logger from 'services/logger'
import { circlesData } from 'services/circlesData'
import { useFilterStore } from 'stores/useFilterStore'
import { useStatsStore } from 'stores/useStatsStore'

const getEventKey = (transactionHash: string, logIndex: number) =>
	`${transactionHash}-${logIndex}`

// watcher
const watchEventUpdates = async (
	queryKey: QueryKey,
	queryClient: QueryClient,
	address: string | null
) => {
	// todo: does not work without sdk, move to direct connection to endpoint?
	const avatarEvents = await (address
		? circlesData.subscribeToEvents(address)
		: circlesData.subscribeToEvents())

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
	watch: boolean,
	address: string | null
): UseQueryResult<Event[]> => {
	const queryClient: QueryClient = useQueryClient()
	const updateEventTypesAmount = useFilterStore.use.updateEventTypesAmount()

	const queryKey = useMemo(
		() => [CIRCLES_EVENTS_QUERY_KEY, startBlock, endBlock, address],
		[startBlock, endBlock, address]
	)

	return useQuery({
		queryKey,
		queryFn: async () => {
			try {
				const response = await axios.post<CirclesEventsResponse>(
					CIRCLES_INDEXER_URL,
					{
						method: 'circles_events',
						// 0xde374ece6fa50e781e81aac78e811b33d16912c7
						params: [address, startBlock, endBlock]
					}
				)

				if (watch) {
					void watchEventUpdates(queryKey, queryClient, address)
				}

				const eventTypesAmount = new Map<CirclesEventType, number>()
				const events = response.data.result.map((event) => {
					eventTypesAmount.set(
						event.event,
						(eventTypesAmount.get(event.event) ?? 0) + ONE
					)

					return {
						...event,
						...event.values,
						blockNumber: hexToNumber(event.values.blockNumber as Hex),
						timestamp: hexToNumber(event.values.timestamp as Hex),
						key: getEventKey(
							event.values.transactionHash,
							Number(event.values.logIndex)
						)
					}
				})
				updateEventTypesAmount(eventTypesAmount)

				logger.log(
					'[service][circles] queried circles events',
					response.data.result,
					{ events }
				)

				return events
			} catch (error) {
				logger.error('[service][circles] Failed to query circles events', error)
				throw new Error('Failed to query circles events')
			}
		},
		enabled
	})
}

// query
const CIRCLES_STATS_QUERY_KEY = 'circlesStats'
export const useFetchCirclesStats = (): UseQueryResult<Event[]> => {
	const setStats = useStatsStore.use.setStats()

	return useQuery({
		queryKey: [CIRCLES_STATS_QUERY_KEY],
		queryFn: async () => {
			try {
				const response = await axios.post<StatsResponse>(CIRCLES_INDEXER_URL, {
					method: 'circles_query',
					params: [
						{
							Namespace: 'V_Crc',
							Table: 'Stats',
							Columns: []
						}
					]
				})

				logger.log('[service][circles] queried circles stats', {
					response: response.data.result
				})
				setStats(response.data.result)

				return response.data.result
			} catch (error) {
				logger.error('[service][circles] Failed to query circles stats', error)
				throw new Error('Failed to query circles stats')
			}
		}
	})
}
