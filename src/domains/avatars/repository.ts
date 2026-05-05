import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'

import { DEAD_ADDRESS } from 'constants/common'
import { MILLISECONDS_IN_A_MINUTE } from 'constants/time'
import { circlesRpcV2 } from 'services/circlesData'
import logger from 'services/logger'

import { adaptAvatarFromSdk } from './adapters'
import type { Avatar } from './types'

// Query keys
export const avatarKeys = {
	all: ['avatars'] as const,
	detail: (id: string) => [...avatarKeys.all, id] as const,
	stats: (id: string) => [...avatarKeys.detail(id), 'stats'] as const
}

const LIMIT_ONE = 1
const VERSION_ONE = 1

interface V1TokenRow {
	token: Address
	tokenOwner: Address
	version: number
}

interface V1MintRow {
	timestamp: number
	from: Address
	to: Address
	tokenAddress: Address
}

interface V2MintRow {
	timestamp: number
	human: Address
}

interface AvatarRegRow {
	timestamp: number
	avatar: Address
}

// Repository methods
export const avatarRepository = {
	// Fetch avatar info with invitedBy and lastMint
	getAvatar: async (address: Address): Promise<Avatar> => {
		try {
			const [avatarInfo, invitedBy, lastMint, registrationTimestamp] =
				await Promise.all([
					circlesRpcV2.avatar.getAvatarInfo(address),
					avatarRepository.getInvitedBy(address),
					avatarRepository.getLastMint(address),
					avatarRepository.getRegistrationTimestamp(address)
				])

			if (!avatarInfo) throw new Error('Avatar not found')

			const avatar = adaptAvatarFromSdk(avatarInfo)
			return {
				...avatar,
				invitedBy,
				// Prefer last personal mint; fall back to registration time so
				// groups/orgs (which never mint personally) still show a date.
				lastMint: lastMint ?? registrationTimestamp ?? avatar.lastMint
			}
		} catch (error) {
			logger.error('[Repository] Failed to fetch avatar:', error)
			throw new Error('Failed to fetch avatar')
		}
	},

	// Fetch the on-chain registration timestamp for any avatar (human/group/org).
	// circles_getAvatarInfoBatch doesn't return a timestamp, so we read it from
	// the V_Crc.Avatars view directly.
	getRegistrationTimestamp: async (
		address: Address
	): Promise<number | undefined> => {
		try {
			const rows = await circlesRpcV2.query.query<AvatarRegRow>({
				Namespace: 'V_Crc',
				Table: 'Avatars',
				Columns: ['timestamp', 'avatar'],
				Filter: [
					{
						Type: 'FilterPredicate',
						FilterType: 'Equals',
						Column: 'avatar',
						Value: address.toLowerCase()
					}
				],
				Order: [{ Column: 'blockNumber', SortOrder: 'DESC' }],
				Limit: LIMIT_ONE
			})
			return rows[0]?.timestamp
		} catch (error) {
			logger.error('[Repository] Failed to fetch registration timestamp:', error)
			return undefined
		}
	},

	// Fetch last mint timestamp for V1 tokens
	getLastMintV1: async (address: Address): Promise<number | undefined> => {
		try {
			const tokens = await circlesRpcV2.query.query<V1TokenRow>({
				Namespace: 'V_Crc',
				Table: 'Tokens',
				Columns: ['token', 'tokenOwner', 'version'],
				Filter: [
					{
						Type: 'Conjunction',
						ConjunctionType: 'And',
						Predicates: [
							{
								Type: 'FilterPredicate',
								FilterType: 'Equals',
								Column: 'tokenOwner',
								Value: address.toLowerCase()
							},
							{
								Type: 'FilterPredicate',
								FilterType: 'Equals',
								Column: 'version',
								Value: VERSION_ONE
							}
						]
					}
				],
				Order: [{ Column: 'blockNumber', SortOrder: 'DESC' }],
				Limit: LIMIT_ONE
			})

			const tokenAddress = tokens[0]?.token
			if (!tokenAddress) return undefined

			const mints = await circlesRpcV2.query.query<V1MintRow>({
				Namespace: 'CrcV1',
				Table: 'Transfer',
				Columns: ['timestamp', 'from', 'to', 'tokenAddress'],
				Filter: [
					{
						Type: 'Conjunction',
						ConjunctionType: 'And',
						Predicates: [
							{
								Type: 'FilterPredicate',
								FilterType: 'Equals',
								Column: 'from',
								Value: DEAD_ADDRESS
							},
							{
								Type: 'FilterPredicate',
								FilterType: 'Equals',
								Column: 'to',
								Value: address.toLowerCase()
							},
							{
								Type: 'FilterPredicate',
								FilterType: 'Equals',
								Column: 'tokenAddress',
								// new SDK returns checksummed addresses; the indexer stores
								// them lowercased — must normalize for the filter to match.
								Value: tokenAddress.toLowerCase()
							}
						]
					}
				],
				Order: [{ Column: 'blockNumber', SortOrder: 'DESC' }],
				Limit: LIMIT_ONE
			})

			return mints[0]?.timestamp
		} catch (error) {
			logger.error('[Repository] Failed to fetch V1 last mint:', error)
			return undefined
		}
	},

	// Fetch last mint timestamp for V2 tokens
	getLastMintV2: async (address: Address): Promise<number | undefined> => {
		try {
			const mints = await circlesRpcV2.query.query<V2MintRow>({
				Namespace: 'CrcV2',
				Table: 'PersonalMint',
				Columns: ['timestamp', 'human'],
				Filter: [
					{
						Type: 'FilterPredicate',
						FilterType: 'Equals',
						Column: 'human',
						Value: address.toLowerCase()
					}
				],
				Order: [{ Column: 'blockNumber', SortOrder: 'DESC' }],
				Limit: LIMIT_ONE
			})

			return mints[0]?.timestamp
		} catch (error) {
			logger.error('[Repository] Failed to fetch V2 last mint:', error)
			return undefined
		}
	},

	// Combined function to fetch the most recent mint timestamp
	getLastMint: async (address: Address): Promise<number | undefined> => {
		try {
			const [lastMintV1, lastMintV2] = await Promise.all([
				avatarRepository.getLastMintV1(address),
				avatarRepository.getLastMintV2(address)
			])

			if (lastMintV1 === undefined && lastMintV2 === undefined) return undefined
			if (lastMintV1 === undefined) return lastMintV2
			if (lastMintV2 === undefined) return lastMintV1
			return Math.max(lastMintV1, lastMintV2)
		} catch (error) {
			logger.error('[Repository] Failed to fetch last mint:', error)
			return undefined
		}
	},

	// Fetch invited by information — origin inviter (the avatar that initiated the
	// invite via InvitationModule), not the Hub-level proxy inviter that signed the
	// registration tx. circles_getInvitationOrigin checks all invitation mechanisms
	// (v2_standard, v2_escrow, v2_at_scale, v1_signup) in one query.
	//
	// Wrapped in try/catch because this runs in Promise.all alongside the avatar
	// info / last-mint fetches; an RPC hiccup here should not fail the whole page.
	getInvitedBy: async (address: Address): Promise<Address | undefined> => {
		try {
			return await circlesRpcV2.invitation.getInvitedBy(address)
		} catch (error) {
			logger.error('[Repository] Failed to fetch invited by:', error)
			return undefined
		}
	}
}

// Cache time constants
const AVATAR_CACHE_MINUTES = 5

// React Query hooks
export const useAvatar = (address?: Address) =>
	useQuery({
		queryKey: address ? avatarKeys.detail(address) : avatarKeys.all,
		queryFn: async () => {
			if (!address) throw new Error('Address is required')
			return avatarRepository.getAvatar(address)
		},
		enabled: !!address,
		staleTime: AVATAR_CACHE_MINUTES * MILLISECONDS_IN_A_MINUTE
	})
