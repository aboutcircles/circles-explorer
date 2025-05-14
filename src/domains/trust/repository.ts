import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'

import { MILLISECONDS_IN_A_MINUTE } from 'constants/time'
import { circlesData } from 'services/circlesData'
import logger from 'services/logger'

import { adaptTrustRelationFromSdk, groupTrustRelations } from './adapters'
import type { GroupedTrustRelations, Invitation, TrustRelation } from './types'

// Query keys
export const trustKeys = {
	all: ['trust'] as const,
	relations: (id: string) => [...trustKeys.all, 'relations', id] as const,
	groupedRelations: (id: string) =>
		[...trustKeys.all, 'groupedRelations', id] as const,
	invitations: (id: string) => [...trustKeys.all, 'invitations', id] as const
}

// Repository methods
export const trustRepository = {
	// Fetch trust relations
	getTrustRelations: async (address: Address): Promise<TrustRelation[]> => {
		try {
			const sdkTrustRelations =
				await circlesData.getAggregatedTrustRelations(address)

			return sdkTrustRelations.map((relation) =>
				adaptTrustRelationFromSdk(relation)
			)
		} catch (error) {
			logger.error('[Repository] Failed to fetch trust relations:', error)
			throw new Error('Failed to fetch trust relations')
		}
	},

	// Fetch and group trust relations
	getGroupedTrustRelations: async (
		address: Address
	): Promise<GroupedTrustRelations> => {
		const relations = await trustRepository.getTrustRelations(address)
		return groupTrustRelations(relations)
	},

	// Fetch invitations
	getInvitations: async (address: Address): Promise<Invitation[]> => {
		try {
			const invitations = await circlesData.getInvitations(address)

			// todo: fix it
			console.log({ invitations, address })

			return []
		} catch (error) {
			logger.error('[Repository] Failed to fetch invitations:', error)
			return []
		}
	}
}

// Cache time constants
const TRUST_CACHE_MINUTES = 5

// React Query hooks
export const useTrustRelations = (address?: Address) =>
	useQuery({
		queryKey: address ? trustKeys.relations(address) : trustKeys.all,
		queryFn: async () => {
			if (!address) throw new Error('Address is required')
			return trustRepository.getTrustRelations(address)
		},
		enabled: !!address,
		staleTime: TRUST_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})

export const useGroupedTrustRelations = (address?: Address) =>
	useQuery({
		queryKey: address ? trustKeys.groupedRelations(address) : trustKeys.all,
		queryFn: async () => {
			if (!address) throw new Error('Address is required')
			return trustRepository.getGroupedTrustRelations(address)
		},
		enabled: !!address,
		staleTime: TRUST_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})

export const useInvitations = (address?: Address) =>
	useQuery({
		queryKey: address ? trustKeys.invitations(address) : trustKeys.all,
		queryFn: async () => {
			if (!address) throw new Error('Address is required')
			return trustRepository.getInvitations(address)
		},
		enabled: !!address,
		staleTime: TRUST_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})
