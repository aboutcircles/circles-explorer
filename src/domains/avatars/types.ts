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

/**
 * Represents token information for an avatar
 */
export interface TokenInfo {
	address: Address
	owner: Address
	totalSupply: string
	type: string
	version: number
	isStopped: boolean
}

/**
 * Represents comprehensive avatar statistics including token information
 */
export interface AvatarStats {
	avatar: Avatar
	v1Token?: TokenInfo
	v2Token?: TokenInfo
	v1MigrationAmount?: number
	formattedAvatarType: string // Human, Group, etc.
}
