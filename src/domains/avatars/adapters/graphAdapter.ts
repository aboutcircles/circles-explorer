import type { Address } from 'viem'

import type {
	GroupedTrustRelations,
	TransformedTrustRelation
} from 'domains/trust/types'
import type {
	CirclesAvatarFromEnvio,
	TrustRelationFromEnvio
} from 'services/envio/indexer'
import type { Avatar } from '../types'

/**
 * Determines the avatar type based on the type string
 */
function getAvatarType(
	type: string
): 'RegisterGroup' | 'RegisterHuman' | undefined {
	if (type.includes('Group')) return 'RegisterGroup'
	if (type.includes('Human') || type.includes('Signup')) return 'RegisterHuman'
	return undefined
}

/**
 * Transforms a TransformedTrustRelation to TrustRelationFromEnvio
 */
function transformToTrustRelationFromEnvio(
	relation: TransformedTrustRelation,
	avatarAddress: Address,
	isGiven: boolean
): TrustRelationFromEnvio {
	const trusterId = isGiven ? avatarAddress : relation.address
	const trusteeId = isGiven ? relation.address : avatarAddress

	return {
		id: `${trusterId}-${trusteeId}` as Address,
		trustee_id: trusteeId,
		truster_id: trusterId,
		isMutual: relation.isMutual,
		version: relation.versions[0] ?? 0,
		timestamp: relation.timestamp,
		limit: '0', // Default value
		expiryTime: '0', // Default value
		trustee: {} as CirclesAvatarFromEnvio, // Will be populated later
		truster: {} as CirclesAvatarFromEnvio, // Will be populated later
		token_id: '' as Address // Not needed for graph
	}
}

/**
 * Adapts an Avatar and its trust relations to the CirclesAvatarFromEnvio format
 * expected by the SocialGraphWrapper component
 */
export function adaptAvatarForGraph(
	avatar: Avatar,
	trustRelations: GroupedTrustRelations
): CirclesAvatarFromEnvio {
	return {
		id: avatar.address,
		cidV0: avatar.cidV0 ?? '',
		avatarType: getAvatarType(avatar.type),
		invitedBy: avatar.invitedBy,
		version: avatar.version,
		isVerified: true, // Default value
		tokenId: avatar.tokenId ?? ('' as Address),
		balances: [], // Not needed for graph
		trustsGiven: trustRelations.given.map((relation) =>
			transformToTrustRelationFromEnvio(relation, avatar.address, true)
		),
		trustsReceived: trustRelations.received.map((relation) =>
			transformToTrustRelationFromEnvio(relation, avatar.address, false)
		),
		trustsGivenCount: trustRelations.given.length,
		trustsReceivedCount: trustRelations.received.length,
		timestamp: avatar.lastMint?.toString(),
		lastMint: avatar.lastMint?.toString()
	}
}
