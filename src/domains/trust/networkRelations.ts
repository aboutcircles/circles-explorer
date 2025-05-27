import type { Address } from 'viem'

import { trustRepository } from './repository'
import type { TrustRelation, TrustNetworkRelation } from './types'

/**
 * Transforms a trust relation from our repository format to the network relation format
 * expected by the social graph component
 */
function transformToNetworkRelation(
	relation: TrustRelation
): TrustNetworkRelation {
	return {
		id: `${relation.subjectAvatar}-${relation.objectAvatar}` as Address,
		trustee_id: relation.objectAvatar,
		truster_id: relation.subjectAvatar,
		isMutual: relation.isMutual,
		version: relation.versions[0] || 0,
		timestamp: relation.timestamp,
		limit: '0', // Default value
		trustee: {
			id: relation.objectAvatar,
			profile: undefined // Will be populated later
		},
		truster: {
			id: relation.subjectAvatar,
			profile: undefined // Will be populated later
		}
	}
}

/**
 * Fetches trust network relations for a list of addresses using the repository
 * This replaces the Envio-based getTrustNetworkRelations function
 *
 * @param addresses List of addresses to fetch trust relations for
 * @returns Promise resolving to array of trust network relations in the same format as Envio
 */
export async function getRepositoryTrustNetworkRelations(
	addresses: Address[]
): Promise<TrustNetworkRelation[]> {
	if (addresses.length === 0) {
		return []
	}

	// Fetch trust relations for each address
	const trustPromises = addresses.map(async (address) =>
		trustRepository.getTrustRelations(address)
	)

	const allRelations = await Promise.all(trustPromises)
	const flattenedRelations = allRelations.flat()

	// Transform to the expected format
	return flattenedRelations.map((relation) =>
		transformToNetworkRelation(relation)
	)
}
