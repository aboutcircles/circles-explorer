import { ENVIO_API_TOKEN, ENVIO_CIRCLES_ENDPOINT } from 'constants/common'
import type { Group } from 'types/group'
import type { Address } from 'viem'
import { getAddress } from 'viem'

import { queries } from './queries'

interface TokenFromEnvio {
	id: string
	tokenType:
		| 'RegisterGroup'
		| 'RegisterHuman'
		| 'Signup'
		| 'WrappedDemurrageToken'
		| 'WrappedStaticToken'
	tokenOwner: CirclesAvatarFromEnvio
	totalSupply: number
}

export interface AvatarBalanceFromEnvio {
	token: TokenFromEnvio
	balance: string
	lastCalculated: number
}

export interface IPFSData {
	name: string
	previewImageUrl: string
	description: string
	imageUrl: string
	cidV0?: string
}

export interface CirclesAvatarFromEnvio {
	id: Address
	cidV0: string
	avatarType?: 'RegisterGroup' | 'RegisterHuman'
	invitedBy?: Address
	profile?: IPFSData
	version: number
	isVerified: boolean
	tokenId: string
	balances: AvatarBalanceFromEnvio[]
	trustsGiven: TrustRelationFromEnvio[]
	trustsReceived: TrustRelationFromEnvio[]
	trustsGivenCount: number
	trustsReceivedCount: number
	timestamp?: string
	lastMint?: string
}

export interface TrustRelationFromEnvio {
	id: Address
	trustee_id: Address
	truster_id: Address
	isMutual: boolean
	version: number
	timestamp: number
	limit: string
	expiryTime: string
	trustee: CirclesAvatarFromEnvio
	truster: CirclesAvatarFromEnvio
	token_id: Address
}

class APIError extends Error {
	public constructor(
		message: string,
		// eslint-disable-next-line @typescript-eslint/parameter-properties
		public status?: number,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/parameter-properties
		public data?: any
	) {
		super(message)
		this.name = 'APIError'
	}
}

const executeQuery = async <T>(
	query: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	variables: Record<string, any>,
	operationName: string
): Promise<T> => {
	const response = await fetch(ENVIO_CIRCLES_ENDPOINT, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${ENVIO_API_TOKEN}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query,
			variables,
			operationName
		})
	})

	if (!response.ok) {
		throw new APIError('Query execution failed', response.status)
	}

	const result = await response.json()

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	if (result.errors) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		throw new APIError('GraphQL errors', undefined, result.errors)
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	return result.data
}

// profile

export const getProfileForAddress = async (
	address: Address
): Promise<CirclesAvatarFromEnvio> => {
	const data = await executeQuery<{ Avatar: CirclesAvatarFromEnvio[] }>(
		queries.PROFILE_FOR_ADDRESS,
		{ address: getAddress(address) },
		'getProfileForAddressQuery'
	)
	return data.Avatar[0]
}

export const verifiedAndUnverifiedCrcTokens = async (
	address: Address
): Promise<{
	AvatarBalance: AvatarBalanceFromEnvio[]
}> => {
	const data = await executeQuery<{
		AvatarBalance: AvatarBalanceFromEnvio[]
	}>(
		queries.VERIFIED_AND_UNVERIFIED_CRC_TOKENS,
		{ address },
		'verifiedAndUnverifiedCRCTokens'
	)

	return data
}

export const checkIfAddressExistsInRegistry = async (
	address: Address
): Promise<boolean> => {
	const data = await executeQuery<{ Avatar: { id: string; cidV0: string }[] }>(
		queries.CHECK_IF_ADDRESS_EXISTS_IN_REGISTRY,
		{ address },
		'checkIfAddressExistsInRegistryQuery'
	)

	return data.Avatar.length > 0
}

// group

export const getGroup = async (address: Address): Promise<Partial<Group>> => {
	const data = await executeQuery<{ Avatar: CirclesAvatarFromEnvio[] }>(
		queries.GET_GROUP,
		{
			address: getAddress(address)
		},
		'getGroup'
	)

	// eslint-disable-next-line @typescript-eslint/prefer-destructuring
	const group = data.Avatar[0]
	return {
		address: group.id,
		name: group.profile?.name,
		circles: true,
		picture: group.profile?.previewImageUrl,
		version: group.version,
		avatarType: group.avatarType,
		description: group.profile?.description
	}
}

export const getGroupMemberships = async (
	address: Address
): Promise<Group[]> => {
	const data = await executeQuery<{
		TrustRelation: { isMutual: boolean; truster: CirclesAvatarFromEnvio }[]
	}>(queries.GET_GROUP_MEMBERSHIPS, { address }, 'getGroupMemberships')

	return data.TrustRelation.filter((row) => !!row.truster.profile).map(
		(row) => ({
			mutualTrust: row.isMutual,
			address: row.truster.id,
			description: row.truster.profile?.description,
			name: row.truster.profile?.name,
			picture:
				row.truster.profile?.previewImageUrl ?? row.truster.profile?.imageUrl
		})
	)
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

export const getTrustNetworkRelations = async (
	addresses: Address[]
): Promise<TrustNetworkRelation[]> => {
	if (addresses.length === 0) {
		return []
	}

	const data = await executeQuery<{
		TrustRelation: TrustNetworkRelation[]
	}>(
		queries.GET_TRUST_NETWORK_RELATIONS,
		{ addresses: addresses.map((addr) => getAddress(addr)) },
		'getTrustNetworkRelations'
	)

	return data.TrustRelation
}

export const getProfilesForAddresses = async (
	addresses: Address[]
): Promise<CirclesAvatarFromEnvio[]> => {
	if (addresses.length === 0) {
		return []
	}

	const data = await executeQuery<{
		Avatar: CirclesAvatarFromEnvio[]
	}>(
		queries.PROFILES_FOR_ADDRESSES,
		{ addresses: addresses.map((addr) => getAddress(addr)) },
		'getProfilesForAddresses'
	)

	return data.Avatar
}
