import type { CirclesEventType } from '@circles-sdk/data'
import type {
	Profile as SDKProfile,
	SearchResultProfile
} from '@circles-sdk/profiles'
import type {
	QueryClient,
	QueryKey,
	UseQueryResult
} from '@tanstack/react-query'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useMemo } from 'react'
import type { Address, Hex } from 'viem'
import { hexToNumber, isAddress, isHash } from 'viem'

import {
	DEFAULT_BLOCK_RANGE,
	MAX_BLOCK_RANGE,
	RANGE_MULTIPLIER,
	MAX_RETRY_COUNT,
	RETRY_INCREMENT
} from 'constants/blockRange'
import { CIRCLES_INDEXER_URL, MINUS_ONE, ONE } from 'constants/common'
import { circlesData, circlesProfiles } from 'services/circlesData'
import logger from 'services/logger'
import { useStatsStore } from 'stores/useStatsStore'
import type { CirclesEventsResponse, Event } from 'types/events'
import type { StatsResult } from 'types/stats'

interface TableResponse {
	columns: string[]
	rows: string[][]
}

function mapTableResponse<T extends { [K in keyof T]: string }>(
	response: TableResponse
): T[] {
	return response.rows.map((row) => {
		const mappedRow = {} as T
		for (const [index, column] of response.columns.entries()) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			mappedRow[column] = row[index] as T[keyof T]
		}
		return mappedRow
	})
}

interface CirclesQueryFilter {
	Type: 'Conjunction' | 'FilterPredicate'
	FilterType?: 'Equals' | 'In'
	ConjunctionType?: 'Or'
	Column?: string
	Value?: unknown[]
	Predicates?: CirclesQueryFilter[]
}

interface CirclesQueryParameters {
	namespace: string
	table: string
	columns: string[]
	filter?: CirclesQueryFilter[]
	order?: unknown[]
	limit?: number
}

async function makeCirclesQuery(
	parameters: CirclesQueryParameters
): Promise<TableResponse> {
	try {
		const response = await axios.post<{ result: TableResponse }>(
			CIRCLES_INDEXER_URL,
			{
				method: 'circles_query',
				params: [
					{
						Namespace: parameters.namespace,
						Table: parameters.table,
						Columns: parameters.columns,
						Filter: parameters.filter ?? [],
						Order: parameters.order ?? [],
						Limit: parameters.limit
					}
				]
			}
		)

		logger.log('[service][circles] queried circles data', {
			namespace: parameters.namespace,
			table: parameters.table,
			rowCount: response.data.result.rows.length
		})

		return response.data.result
	} catch (error) {
		logger.error('[service][circles] Failed to query circles data', error)
		throw new Error(`Failed to query circles ${parameters.table}`)
	}
}

export type Profile = SearchResultProfile

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
		? circlesData.subscribeToEvents(address as Address)
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
				if (!cacheData)
					return [
						{
							events: [event]
						}
					]

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

// Helper function to fetch events
const fetchEvents = async (
	startBlock: number,
	endBlock: number | null,
	search: string | null
): Promise<{
	events: Event[]
	eventTypesAmount: Map<CirclesEventType, number>
}> => {
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
			`Event count: ${events.length}, startBlock: ${startBlock}, endBlock: ${endBlock}`
		)

		return { events, eventTypesAmount }
	} catch (error) {
		logger.error('[service][circles] Failed to query circles events', error)
		throw new Error('Failed to query circles events')
	}
}

// Recursive query until events are found
const CIRCLES_EVENTS_RECURSIVE_QUERY_KEY = 'circlesEventsRecursive'
export const useFetchCirclesEventsRecursive = (
	initialBlock: number,
	enabled: boolean,
	watch: boolean,
	search: string | null,
	eventCount: number
): UseQueryResult<{
	events: Event[]
	eventTypesAmount: Map<CirclesEventType, number>
	finalRange: number
	finalStartBlock: number
	previousEventCount: number
}> => {
	const queryClient: QueryClient = useQueryClient()

	const queryKey = useMemo(
		() => [CIRCLES_EVENTS_RECURSIVE_QUERY_KEY, search],
		[search]
	)

	return useQuery({
		queryKey,
		queryFn: async () => {
			const fetchWithRetry = async (
				currentRange: number,
				currentStartBlock: number,
				tryCount: number,
				previousEventCount: number
			): Promise<{
				events: Event[]
				eventTypesAmount: Map<CirclesEventType, number>
				finalRange: number
				finalStartBlock: number
				previousEventCount: number
			}> => {
				// Base case: reached max retries
				if (tryCount >= MAX_RETRY_COUNT) {
					return {
						events: [],
						eventTypesAmount: new Map(),
						finalRange: currentRange,
						finalStartBlock: currentStartBlock,
						previousEventCount
					}
				}

				// Fetch events for current range
				const response = await fetchEvents(currentStartBlock, null, search)
				const newEventCount = response.events.length
				console.log({ newEventCount, previousEventCount, currentStartBlock })

				// Success case: found more events than before
				if (newEventCount > previousEventCount) {
					// If we found events, set up watch if needed
					if (watch) {
						void watchEventUpdates(
							queryKey,
							queryClient,
							isAddress(search ?? '') ? search : null
						)
					}

					return {
						events: response.events,
						eventTypesAmount: response.eventTypesAmount,
						finalRange: currentRange,
						finalStartBlock: currentStartBlock,
						previousEventCount: newEventCount
					}
				}

				// see src/constants/blockRange.ts:2 for reference
				const nextRange = Math.min(
					tryCount === 0 ? currentRange : currentRange * RANGE_MULTIPLIER,
					MAX_BLOCK_RANGE
				)
				const nextStartBlock = Math.max(0, initialBlock - nextRange)

				logger.log('[service][circles] Expanded range', {
					tryCount,
					blocks: nextRange
				})

				// Stop if we hit block 0
				if (nextStartBlock <= 0) {
					return {
						events: [],
						eventTypesAmount: new Map(),
						finalRange: nextRange,
						finalStartBlock: nextStartBlock,
						previousEventCount: newEventCount
					}
				}

				// Recursive case: try with expanded range
				return fetchWithRetry(
					nextRange,
					nextStartBlock,
					tryCount + RETRY_INCREMENT,
					newEventCount
				)
			}

			// Start the recursive fetching
			return fetchWithRetry(DEFAULT_BLOCK_RANGE, initialBlock, 0, eventCount)
		},
		enabled
	})
}

// query
const CIRCLES_STATS_QUERY_KEY = 'circlesStats'
export const useFetchCirclesStats = (): UseQueryResult<StatsResult> => {
	const setStats = useStatsStore.use.setStats()

	return useQuery({
		queryKey: [CIRCLES_STATS_QUERY_KEY],
		queryFn: async () => {
			const result = await makeCirclesQuery({
				namespace: 'V_Crc',
				table: 'Stats',
				columns: ['measure', 'value']
			})

			setStats(result as StatsResult)
			return result
		}
	})
}

// query
const CIRCLES_CRC_V2_TOKEN_STOPPED = 'circlesCrcV2TokenStopped'
export const useFetchCrcV2TokenStopped = (address: Address): UseQueryResult =>
	useQuery({
		queryKey: [CIRCLES_CRC_V2_TOKEN_STOPPED, address],
		queryFn: async () =>
			makeCirclesQuery({
				namespace: 'CrcV2',
				table: 'Stopped',
				columns: ['avatar'],
				filter: [
					{
						Type: 'Conjunction',
						ConjunctionType: 'Or',
						Predicates: [
							{
								Type: 'FilterPredicate',
								FilterType: 'Equals',
								Column: 'avatar',
								Value: [address.toLowerCase()]
							}
						]
					}
				]
			}),
		enabled: Boolean(address)
	})

interface TotalSupplyV1Row {
	tokenAddress: string
	user: string
	totalSupply: string
}

// V1 Total Supply Query
const CIRCLES_CRC_V1_TOTAL_SUPPLY = 'circlesCrcV1TotalSupply'
export const useFetchCrcV1TotalSupply = (
	address: Address
): UseQueryResult<TotalSupplyV1Row> =>
	useQuery({
		queryKey: [CIRCLES_CRC_V1_TOTAL_SUPPLY, address],
		queryFn: async () => {
			const result = await makeCirclesQuery({
				namespace: 'V_CrcV1',
				table: 'TotalSupply',
				columns: ['tokenAddress', 'user', 'totalSupply'],
				filter: [
					{
						Type: 'Conjunction',
						ConjunctionType: 'Or',
						Predicates: [
							{
								Type: 'FilterPredicate',
								FilterType: 'Equals',
								Column: 'user',
								Value: [address.toLowerCase()]
							}
						]
					}
				],
				limit: ONE
			})

			return mapTableResponse<TotalSupplyV1Row>(result)[0] ?? null
		},
		enabled: Boolean(address)
	})

interface TotalSupplyV2Row {
	tokenAddress: string
	tokenId: string
	totalSupply: string
}

// V2 Total Supply Query
const CIRCLES_CRC_V2_TOTAL_SUPPLY = 'circlesCrcV2TotalSupply'
export const useFetchCrcV2TotalSupply = (
	address: Address
): UseQueryResult<TotalSupplyV2Row> =>
	useQuery({
		queryKey: [CIRCLES_CRC_V2_TOTAL_SUPPLY, address],
		queryFn: async () => {
			const result = await makeCirclesQuery({
				namespace: 'V_CrcV2',
				table: 'TotalSupply',
				columns: ['tokenAddress', 'tokenId', 'totalSupply'],
				filter: [
					{
						Type: 'Conjunction',
						ConjunctionType: 'Or',
						Predicates: [
							{
								Type: 'FilterPredicate',
								FilterType: 'Equals',
								Column: 'tokenAddress',
								Value: [address.toLowerCase()]
							}
						]
					}
				],
				limit: ONE
			})

			return mapTableResponse<TotalSupplyV2Row>(result)[0] ?? null
		},
		enabled: Boolean(address)
	})

// query
const CIRCLES_PROFILES_SEARCH_BY_NAME = 'circlesProfilesSearchByName'
export const useSearchProfileByName = (
	name: string
): UseQueryResult<SDKProfile[]> =>
	useQuery({
		queryKey: [CIRCLES_PROFILES_SEARCH_BY_NAME, name],
		queryFn: async () => {
			try {
				const results = await circlesProfiles.searchByName(name, {
					fetchComplete: true
				})

				logger.log('[service][circles] queried circles profile by name', {
					name,
					resultCount: results.length
				})

				return results
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
