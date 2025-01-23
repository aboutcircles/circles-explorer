import { useMemo } from 'react'
import axios from 'axios'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { CirclesEventType } from '@circles-sdk/data'
import type {
	UseQueryResult,
	QueryClient,
	QueryKey
} from '@tanstack/react-query'
import { hexToNumber, isAddress, isHash } from 'viem'
import type { Hex, Address } from 'viem'

import {
	CIRCLES_INDEXER_URL,
	MINUS_ONE,
	ONE,
	CIRCLES_PROFILE_SERVICE_URL
} from 'constants/common'
import type { CirclesEventsResponse, Event } from 'types/events'
import type { StatsResponse } from 'types/stats'
import logger from 'services/logger'
import { circlesData } from 'services/circlesData'
import { useStatsStore } from 'stores/useStatsStore'

export interface Profile {
	address: string
	name: string
	description: string
	CID: string
	lastUpdatedAt: number
}

const getEventKey = (transactionHash: string, logIndex: number) =>
	`${transactionHash}-${logIndex}`

const defineFiltersFromSearch = (search: string | null) => {
	if (!search || isAddress(search)) return null

	if (isHash(search)) {
		return [
			{
				Type: 'FilterPredicate',
				FilterType: 'In',
				Column: 'transactionHash',
				Value: [search]
			}
		]
	}

	// todo: fix this, getting server error now
	if (Number.isInteger(Number(search))) {
		return [
			{
				Type: 'FilterPredicate',
				FilterType: 'In',
				Column: 'blockNumber',
				Value: [Number(search)]
			}
		]
	}

	return null
}

// watcher
const watchEventUpdates = async (
	queryKey: QueryKey,
	queryClient: QueryClient,
	address: string | null
) => {
	const avatarEvents = await (address
		? circlesData.subscribeToEvents(address)
		: circlesData.subscribeToEvents())

	avatarEvents.subscribe((event) => {
		const key = getEventKey(
			event.transactionHash ?? `${event.blockNumber}-${event.transactionIndex}`,
			event.logIndex
		)

		queryClient.setQueryData(
			queryKey,
			(cacheData?: {
				events: Event[]
				eventTypesAmount: Map<CirclesEventType, number>
			}) => {
				if (!cacheData) return [event]

				const updatedData = [...cacheData.events]

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

				return {
					...cacheData,
					events: updatedData
				}
			}
		)
	})
}

// query
const CIRCLES_EVENTS_QUERY_KEY = 'circlesEvents'
export const useFetchCirclesEvents = (
	startBlock: number,
	endBlock: number,
	enabled: boolean,
	watch: boolean,
	search: string | null
): UseQueryResult<{
	events: Event[]
	eventTypesAmount: Map<CirclesEventType, number>
}> => {
	const queryClient: QueryClient = useQueryClient()

	const queryKey = useMemo(
		() => [CIRCLES_EVENTS_QUERY_KEY, startBlock, endBlock, search],
		[startBlock, endBlock, search]
	)

	return useQuery({
		queryKey,
		queryFn: async () => {
			try {
				const address = isAddress(search ?? '') ? search : null
				const filters = address ? null : defineFiltersFromSearch(search)

				const response = await axios.post<CirclesEventsResponse>(
					CIRCLES_INDEXER_URL,
					{
						method: 'circles_events',
						params: filters
							? [null, 0, null, null, filters]
							: [address, startBlock, endBlock]
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
						logIndex: hexToNumber(event.values.logIndex as Hex),
						transactionIndex: hexToNumber(event.values.transactionIndex as Hex),
						values: null,
						key: getEventKey(
							event.values.transactionHash,
							Number(event.values.logIndex)
						)
					}
				})

				logger.log(
					'[service][circles] queried circles events',
					response.data.result,
					{ events }
				)

				return { events, eventTypesAmount }
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

// query
const CIRCLES_CRC_V2_TOKEN_STOPPED = 'circlesCrcV2TokenStopped'
export const useFetchCrcV2TokenStopped = (address: Address): UseQueryResult =>
	useQuery({
		queryKey: [CIRCLES_CRC_V2_TOKEN_STOPPED],
		queryFn: async () => {
			try {
				const response = await axios.post<StatsResponse>(CIRCLES_INDEXER_URL, {
					method: 'circles_query',
					params: [
						{
							Namespace: 'CrcV2',
							Table: 'Stopped',
							Columns: [],
							Filter: [
								{
									Type: 'Conjunction',
									ConjunctionType: 'Or',
									Predicates: [
										{
											Type: 'FilterPredicate',
											FilterType: 'Equals',
											Column: 'avatar',
											Value: [address]
										}
									]
								}
							]
						}
					]
				})

				logger.log(
					'[service][circles] queried circles crc v2 token stopped status',
					{
						response: response.data.result
					}
				)

				return response.data.result
			} catch (error) {
				logger.error(
					'[service][circles] Failed to query crc v2 token stopped status',
					error
				)
				throw new Error('Failed to query circles crc v2 token stopped status')
			}
		}
	})

// query
const CIRCLES_PROFILES_SEARCH_BY_NAME = 'circlesProfilesSearchByName'
export const useSearchProfileByName = (name: string): UseQueryResult =>
	useQuery({
		queryKey: [CIRCLES_PROFILES_SEARCH_BY_NAME, name],
		queryFn: async () => {
			try {
				const response = await axios.get<StatsResponse>(
					`${CIRCLES_PROFILE_SERVICE_URL}/search?name=${name}`
				)

				logger.log('[service][circles] queried circles profile by name', {
					name,
					response: response.data
				})

				return response.data
			} catch (error) {
				logger.error(
					'[service][circles] Failed to query circles profile by name',
					error
				)
				throw new Error('Failed to query circles profile by name')
			}
		},
		enabled: Boolean(name)
	})
