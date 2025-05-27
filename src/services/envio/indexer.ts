import { ENVIO_API_TOKEN, ENVIO_CIRCLES_ENDPOINT } from 'constants/common'
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

// still using it as a fallback
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
