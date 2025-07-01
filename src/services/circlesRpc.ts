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
