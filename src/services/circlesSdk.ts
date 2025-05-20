import { CirclesData, CirclesRpc } from '@circles-sdk/data'
import type { TrustRelationRow } from '@circles-sdk/data/dist/rows/trustRelationRow'
import { CIRCLES_INDEXER_URL } from 'constants/common'
import type { Address } from 'viem'

// Initialize the CirclesData instance
const rpc = new CirclesRpc(CIRCLES_INDEXER_URL)
export const circlesData = new CirclesData(rpc)

/**
 * Fetches and aggregates trust relations for a given avatar.
 * This includes both incoming and outgoing trust relations,
 * with proper handling of mutual trust and version-specific relations.
 *
 * @param address The avatar address to get trust relations for
 * @param version Optional version filter (1 or 2)
 * @returns Promise resolving to array of trust relations
 */
export async function getAvatarTrustRelations(
	address: Address,
	version?: number
): Promise<TrustRelationRow[]> {
	try {
		return await circlesData.getAggregatedTrustRelations(address, version)
	} catch (error) {
		console.error('[CirclesSDK] Failed to fetch trust relations:', error)
		throw new Error('Failed to fetch trust relations')
	}
}

/**
 * Gets the raw trust relations query for an avatar.
 * This returns a CirclesQuery instance that can be used
 * for paginated access to trust relations.
 *
 * @param address The avatar address
 * @param pageSize Number of items per page
 * @returns CirclesQuery instance for trust relations
 */
export function getTrustRelationsQuery(address: Address, pageSize: number) {
	return circlesData.getTrustRelations(address, pageSize)
}

/**
 * Gets basic information about an avatar.
 * This includes signup timestamp, circles version, and token info.
 *
 * @param address The avatar address to get info for
 * @returns Promise resolving to avatar info or undefined if not found
 */
export async function getAvatarInfo(address: Address) {
	try {
		return await circlesData.getAvatarInfo(address)
	} catch (error) {
		console.error('[CirclesSDK] Failed to fetch avatar info:', error)
		throw new Error('Failed to fetch avatar info')
	}
}
