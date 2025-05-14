import type { TrustRelationRow } from '@circles-sdk/data/dist/rows/trustRelationRow'
import type { Address } from 'viem'
import type {
	GroupedTrustRelations,
	Invitation,
	TransformedTrustRelation,
	TrustRelation
} from './types'

/**
 * Adapts a trust relation from the SDK format to our domain model
 */
export const adaptTrustRelationFromSdk = (
	sdkTrustRelation: TrustRelationRow
): TrustRelation => ({
	subjectAvatar: sdkTrustRelation.subjectAvatar,
	objectAvatar: sdkTrustRelation.objectAvatar,
	relation: sdkTrustRelation.relation,
	timestamp: sdkTrustRelation.timestamp,
	versions: sdkTrustRelation.versions,
	isMutual: sdkTrustRelation.relation === 'mutuallyTrusts'
})

/**
 * Transforms a trust relation to include type and address for UI convenience
 */
export const transformTrustRelation = (
	relation: TrustRelation,
	type: 'given' | 'received'
): TransformedTrustRelation => ({
	...relation,
	type,
	address: relation.objectAvatar
})

/**
 * Groups trust relations into given and received
 */
export const groupTrustRelations = (
	relations: TrustRelation[]
): GroupedTrustRelations => {
	const given: TransformedTrustRelation[] = []
	const received: TransformedTrustRelation[] = []

	for (const relation of relations) {
		if (
			relation.relation === 'trusts' ||
			relation.relation === 'mutuallyTrusts'
		) {
			given.push(transformTrustRelation(relation, 'given'))
		}

		if (
			relation.relation === 'trustedBy' ||
			relation.relation === 'mutuallyTrusts'
		) {
			received.push(transformTrustRelation(relation, 'received'))
		}
	}

	return { given, received }
}

/**
 * Creates an invitation object
 */
export const createInvitation = (
	inviter: Address,
	invited: Address,
	timestamp: number,
	transactionHash: string
): Invitation => ({
	inviter,
	invited,
	timestamp,
	transactionHash
})
