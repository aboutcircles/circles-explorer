import type { Address } from 'viem'

/**
 * Represents a trust relation between two avatars
 */
export interface TrustRelation {
	subjectAvatar: Address
	objectAvatar: Address
	relation:
		| 'mutuallyTrusts'
		| 'selfTrusts'
		| 'trustedBy'
		| 'trusts'
		| 'variesByVersion'
	timestamp: number
	versions: number[]
	isMutual: boolean
}

/**
 * Represents a transformed trust relation with additional metadata
 */
export interface TransformedTrustRelation extends TrustRelation {
	type: 'given' | 'received'
	address: Address // The counterpart address (for UI convenience)
}

/**
 * Represents trust relations grouped by direction
 */
export interface GroupedTrustRelations {
	given: TransformedTrustRelation[]
	received: TransformedTrustRelation[]
}

/**
 * Represents an invitation from one avatar to another
 */
export interface Invitation {
	inviter: Address
	invited: Address
	timestamp: number
	transactionHash: string
}
