import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import type { Address } from 'viem'

import { MILLISECONDS_IN_A_MINUTE } from 'constants/time'
import { circlesData } from 'services/circlesData'
import logger from 'services/logger'

import { CirclesQuery } from '@circles-sdk/data'
import { adaptTrustRelationFromSdk, groupTrustRelations } from './adapters'
import type {
	GroupedTrustRelations,
	Invitation,
	TrustRelation,
	ValidateTrustRequest,
	ValidateTrustResponse
} from './types'

// API endpoint for trust validation
const TRUST_VALIDATION_API_URL: string =
	(import.meta.env.VITE_TRUST_VALIDATION_API_URL as string) ||
	'https://safe-watch-api-dev.ai.gnosisdev.com/validate-trust'

// Query keys
export const trustKeys = {
	all: ['trust'] as const,
	relations: (id: string) => [...trustKeys.all, 'relations', id] as const,
	groupedRelations: (id: string) =>
		[...trustKeys.all, 'groupedRelations', id] as const,
	invitations: (id: string) => [...trustKeys.all, 'invitations', id] as const,
	validation: ['trust', 'validation'] as const
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
			const pageSize = 200
			// todo: it'll be changed to circlesData.getInvitations after sdk fix
			const query = new CirclesQuery<Invitation>(circlesData.rpc, {
				namespace: 'CrcV2',
				table: 'RegisterHuman',
				columns: [
					'blockNumber',
					'timestamp',
					'transactionIndex',
					'logIndex',
					'transactionHash',
					'avatar',
					'inviter'
				],
				filter: [
					{
						Type: 'FilterPredicate',
						FilterType: 'Equals',
						Column: 'inviter',
						Value: address.toLowerCase()
					}
				],
				sortOrder: 'DESC',
				limit: pageSize
			})

			const invitations: Invitation[] = []

			// Fetch all pages
			let hasMorePages = true
			while (hasMorePages) {
				// eslint-disable-next-line no-await-in-loop
				hasMorePages = await query.queryNextPage()
				const results = query.currentPage?.results ?? []
				if (results.length === 0) break
				invitations.push(...results)
				if (results.length < pageSize) break // No more results to fetch
			}

			return invitations
		} catch (error) {
			logger.error('[Repository] Failed to fetch invitations:', error)
			return []
		}
	},

	// Validate trust connection
	validateTrust: async (
		request: ValidateTrustRequest
	): Promise<ValidateTrustResponse> => {
		try {
			const response = await axios.post<ValidateTrustResponse>(
				TRUST_VALIDATION_API_URL,
				request
			)
			return response.data
		} catch (error) {
			logger.error('[Repository] Failed to validate trust:', error)
			throw new Error('Failed to validate trust connection')
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

export const useValidateTrust = () =>
	useMutation<ValidateTrustResponse, Error, ValidateTrustRequest>({
		mutationFn: trustRepository.validateTrust,
		mutationKey: trustKeys.validation
	})
