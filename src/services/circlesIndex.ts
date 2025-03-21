import type {
	Profile as SDKProfile,
	SearchResultProfile
} from '@circles-sdk/profiles'
import type { UseQueryResult } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import type { Address } from 'viem'

import { CIRCLES_INDEXER_URL, ONE } from 'constants/common'
import { circlesProfiles } from 'services/circlesData'
import logger from 'services/logger'
import { useStatsStore } from 'stores/useStatsStore'
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
