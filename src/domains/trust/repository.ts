import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'

import { MILLISECONDS_IN_A_MINUTE } from 'constants/time'
import { circlesRpcV2 } from 'services/circlesData'
import logger from 'services/logger'

import { groupTrustRelations } from './adapters'
import type { GroupedTrustRelations, Invitation, TrustRelation } from './types'

interface TrustRow {
	timestamp: number
	version: number
	trustee: Address
	truster: Address
}

// Indexer's hard cap on circles_query is 10_000. The legacy SDK paginated at
// pageSize=1000 looping until exhausted; we use a single-page query at the cap
// instead. No avatar in production currently approaches this (largest pinned
// groups are well under 5k trust counterparts) and using one query avoids the
// extra round-trips. If this ever truncates, switch to circles_paginated_query.
const TRUST_QUERY_LIMIT = 10_000

// Aggregate raw V1+V2 trust event rows into per-counterpart `TrustRelation`s.
// Replaces the legacy SDK's `getAggregatedTrustRelations` so we can compute the
// `versions` field client-side from the unified V_Crc.TrustRelations view —
// the new SDK's server-side equivalent only returns V2 and drops `versions`.
const aggregateTrustRows = (
	avatarAddress: string,
	rows: TrustRow[]
): TrustRelation[] => {
	const buckets = new Map<
		Address,
		{ rows: TrustRow[]; versions: Set<number> }
	>()

	for (const row of rows) {
		const counterpart =
			row.truster.toLowerCase() === avatarAddress
				? row.trustee
				: row.truster
		if (counterpart.toLowerCase() === avatarAddress) continue
		const bucket = buckets.get(counterpart) ?? { rows: [], versions: new Set() }
		bucket.rows.push(row)
		bucket.versions.add(row.version)
		buckets.set(counterpart, bucket)
	}

	const relations: TrustRelation[] = []

	for (const [counterpart, { rows: bucketRows, versions }] of buckets) {
		const versionRelations = new Map<number, TrustRelation['relation']>()

		for (const ver of versions) {
			const versionRows = bucketRows.filter((row) => row.version === ver)
			if (versionRows.length >= 2) {
				versionRelations.set(ver, 'mutuallyTrusts')
			} else if (versionRows[0].trustee.toLowerCase() === avatarAddress) {
				versionRelations.set(ver, 'trustedBy')
			} else {
				versionRelations.set(ver, 'trusts')
			}
		}

		const distinct = new Set(versionRelations.values())
		const relation: TrustRelation['relation'] =
			distinct.size === 1
				? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					[...distinct][0]!
				: 'variesByVersion'

		relations.push({
			subjectAvatar: avatarAddress as Address,
			objectAvatar: counterpart,
			relation,
			timestamp: Math.max(...bucketRows.map((row) => row.timestamp)),
			versions: [...versions],
			isMutual: relation === 'mutuallyTrusts'
		})
	}

	return relations
}

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
			const lowerAddress = address.toLowerCase()
			const rows = await circlesRpcV2.query.query<TrustRow>({
				Namespace: 'V_Crc',
				Table: 'TrustRelations',
				Columns: ['timestamp', 'version', 'trustee', 'truster'],
				Filter: [
					{
						Type: 'Conjunction',
						ConjunctionType: 'Or',
						Predicates: [
							{
								Type: 'FilterPredicate',
								FilterType: 'Equals',
								Column: 'trustee',
								Value: lowerAddress
							},
							{
								Type: 'FilterPredicate',
								FilterType: 'Equals',
								Column: 'truster',
								Value: lowerAddress
							}
						]
					}
				],
				Order: [{ Column: 'blockNumber', SortOrder: 'DESC' }],
				Limit: TRUST_QUERY_LIMIT
			})

			return aggregateTrustRows(lowerAddress, rows)
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

	// Fetch invitations — accounts that this avatar invited.
	// Uses circles_getInvitationsFrom which aggregates origin invitations across
	// all mechanisms (v2_standard, v2_escrow, v2_at_scale), so this returns the
	// people the avatar genuinely invited (not just the proxy/Hub-level view from
	// RegisterHuman that the previous implementation queried).
	getInvitations: async (address: Address): Promise<Invitation[]> => {
		try {
			const response = await circlesRpcV2.invitation.getInvitationsFrom(
				address,
				true
			)
			return response.results.map((invited) => ({
				blockNumber: invited.blockNumber ?? 0,
				transactionIndex: 0,
				logIndex: 0,
				timestamp: invited.timestamp ?? 0,
				transactionHash: '',
				inviter: address,
				avatar: invited.address
			}))
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
