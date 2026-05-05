import type { TrustRelationRow } from '@circles-sdk/data/dist/rows/trustRelationRow'
import { useQuery } from '@tanstack/react-query'
import { getAvatarTrustRelations } from 'services/circlesSdk'
import type { Address } from 'viem'

export interface TransformedTrustRelation {
	type: 'given' | 'received'
	address: Address
	version: number[]
	isMutual: boolean
	timestamp: number
	relation: TrustRelationRow['relation']
}

export interface GroupedTrustRelations {
	given: TransformedTrustRelation[]
	received: TransformedTrustRelation[]
}

function transformTrustRelations(
	relations: TrustRelationRow[]
): GroupedTrustRelations {
	return {
		given: relations
			.filter((r) => r.relation === 'trusts' || r.relation === 'mutuallyTrusts')
			.map((r) => ({
				type: 'given',
				address: r.objectAvatar,
				version: r.versions,
				isMutual: r.relation === 'mutuallyTrusts',
				timestamp: r.timestamp,
				relation: r.relation
			})),
		received: relations
			.filter(
				(r) => r.relation === 'trustedBy' || r.relation === 'mutuallyTrusts'
			)
			.map((r) => ({
				type: 'received',
				address: r.objectAvatar,
				version: r.versions,
				isMutual: r.relation === 'mutuallyTrusts',
				timestamp: r.timestamp,
				relation: r.relation
			}))
	}
}

export function useSdkTrustRelations(address?: Address) {
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['sdkTrustRelations', address],
		queryFn: async () => {
			if (!address) throw new Error('Address is required')
			const relations = await getAvatarTrustRelations(address)
			return transformTrustRelations(relations)
		},
		enabled: false // Disable auto-fetching
	})

	return {
		trustRelations: data,
		isLoading,
		error,
		refetch
	}
}
