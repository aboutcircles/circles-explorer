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
	blockNumber: number
	transactionIndex: number
	logIndex: number
	timestamp: number
	transactionHash: string
	inviter: Address
	avatar: Address
}

export interface TrustNetworkRelation {
	id: Address
	trustee_id: Address
	truster_id: Address
	isMutual: boolean
	version: number
	timestamp: number
	limit: string
	trustee: {
		id: Address
		profile?: {
			name: string
			previewImageUrl: string
		}
	}
	truster: {
		id: Address
		profile?: {
			name: string
			previewImageUrl: string
		}
	}
}

/**
 * Request payload for trust validation
 */
export interface ValidateTrustRequest {
	truster: string
	trustee: string
	expiration_time: number
}

/**
 * Response from trust validation API
 */
export interface ValidateTrustResponse {
	validation_id: string
	overall_danger_score: number
	tldr: string
	summary: string
}
