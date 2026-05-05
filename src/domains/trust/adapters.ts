import type {
	GroupedTrustRelations,
	TransformedTrustRelation,
	TrustRelation
} from './types'

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
