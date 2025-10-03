import { CIRCLES_INDEXER_URL } from 'constants/common'
import logger from './logger'

// Constants
const RPC_ID = 1
const DEFAULT_SEARCH_LIMIT = 100

/**
 * JSON-RPC response type
 */
interface RpcResponse<T> {
	jsonrpc: string
	id: number
	result?: T
	error?: {
		code: number
		message: string
	}
}

/**
 * JSON-RPC client for Circles profile queries
 */
class CirclesRpcClient {
	// eslint-disable-next-line class-methods-use-this,@typescript-eslint/class-methods-use-this
	private async makeRpcCall<T>(
		method: string,
		parameters: unknown[]
	): Promise<T> {
		try {
			const response = await fetch(CIRCLES_INDEXER_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: RPC_ID,
					method,
					params: parameters
				})
			})

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			const data = (await response.json()) as RpcResponse<T>

			if (data.error) {
				throw new Error(`RPC error: ${data.error.message}`)
			}

			if (data.result === undefined) {
				throw new Error('RPC response missing result')
			}

			return data.result
		} catch (error) {
			logger.error(`[CirclesRpc] Failed to call ${method}:`, error)
			throw error
		}
	}

	/**
	 * Make multiple RPC calls in a single HTTP request using JSON-RPC batch
	 */
	// eslint-disable-next-line class-methods-use-this,@typescript-eslint/class-methods-use-this
	private async makeBatchRpcCall<T>(
		requests: { method: string; params: unknown[]; id: number }[]
	): Promise<
		{ result?: T; error?: { code: number; message: string }; id: number }[]
	> {
		try {
			const batchRequest = requests.map((request) => ({
				jsonrpc: '2.0',
				method: request.method,
				params: request.params,
				id: request.id
			}))

			const response = await fetch(CIRCLES_INDEXER_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(batchRequest)
			})

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			return await response.json()
		} catch (error) {
			logger.error('[CirclesRpc] Failed to make batch RPC call:', error)
			throw error
		}
	}

	/**
	 * Search profiles by name, description or address
	 */
	public async searchProfiles(
		query: string,
		limit = DEFAULT_SEARCH_LIMIT,
		offset = 0
	): Promise<RpcProfile[]> {
		return this.makeRpcCall<RpcProfile[]>('circles_searchProfiles', [
			query,
			limit,
			offset
		])
	}

	/**
	 * Get a profile by its CID
	 */
	public async getProfileByCid(cid: string): Promise<RpcProfile | null> {
		return this.makeRpcCall<RpcProfile | null>('circles_getProfileByCid', [cid])
	}

	/**
	 * Get many profiles by CIDs
	 */
	public async getProfileByCidBatch(
		cids: string[]
	): Promise<(RpcProfile | null)[]> {
		return this.makeRpcCall<(RpcProfile | null)[]>(
			'circles_getProfileByCidBatch',
			[cids]
		)
	}

	/**
	 * Get profile by address
	 */
	public async getProfileByAddress(
		address: string
	): Promise<RpcProfile | null> {
		return this.makeRpcCall<RpcProfile | null>('circles_getProfileByAddress', [
			address
		])
	}

	/**
	 * Get profiles by addresses in batch
	 */
	public async getProfileByAddressBatch(
		addresses: string[]
	): Promise<(RpcProfile | null)[]> {
		return this.makeRpcCall<(RpcProfile | null)[]>(
			'circles_getProfileByAddressBatch',
			[addresses]
		)
	}

	/**
	 * Get profiles for multiple chunks in a single HTTP request using batch RPC
	 */
	public async getProfilesByAddressBatches(
		chunks: string[][]
	): Promise<
		{ profiles: (RpcProfile | null)[]; error?: string; chunkIndex: number }[]
	> {
		const requests = chunks.map((chunk, index) => ({
			method: 'circles_getProfileByAddressBatch',
			params: [chunk],
			id: index
		}))

		const responses =
			await this.makeBatchRpcCall<(RpcProfile | null)[]>(requests)

		return responses.map((response) => ({
			profiles: response.result ?? [],
			error: response.error?.message,
			chunkIndex: response.id
		}))
	}

	/**
	 * Generic passthrough for circles_query to query tabular data
	 * The query object should follow indexer schema: { Namespace, Table, Columns, Filter, Order, Limit }
	 */
	public async circlesQuery<T>(query: unknown): Promise<T> {
		return this.makeRpcCall<T>('circles_query', [query])
	}
}

/**
 * RPC Profile response type
 */
export interface RpcProfile {
	address: string
	name: string
	description: string
	previewImageUrl: string
	imageUrl?: string
	shortName: string
	CID?: string
	lastUpdatedAt?: number
	registeredName?: string
	location?: string
}

// Export singleton instance
export const circlesRpc = new CirclesRpcClient()
