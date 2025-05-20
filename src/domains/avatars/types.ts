import type { Address } from 'viem'

/**
 * Represents a Circles avatar with basic information
 */
export interface Avatar {
	id: string
	address: Address
	type: string
	version: number
	lastMint?: number
	invitedBy?: Address
	tokenId?: Address
	v1Token?: Address
	cidV0?: string
}
