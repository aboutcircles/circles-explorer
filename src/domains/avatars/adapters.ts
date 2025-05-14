import type { AvatarRow } from '@circles-sdk/data/dist/rows/avatarRow'
import type { TokenInfoRow } from '@circles-sdk/data/dist/rows/tokenInfoRow'
import type { Address } from 'viem'
import type { Avatar, AvatarStats, TokenInfo } from './types'

/**
 * Adapts an avatar from the SDK format to our domain model
 */
export const adaptAvatarFromSdk = (sdkAvatar: AvatarRow): Avatar => ({
	id: sdkAvatar.avatar,
	address: sdkAvatar.avatar,
	type: sdkAvatar.type,
	version: sdkAvatar.version,
	lastMint: sdkAvatar.timestamp,
	// The SDK doesn't have invitedBy directly in AvatarRow
	// We'll need to fetch this separately
	invitedBy: undefined,
	tokenId: sdkAvatar.tokenId as Address,
	v1Token: sdkAvatar.v1Token,
	cidV0: sdkAvatar.cidV0
})

/**
 * Adapts a token from the SDK format to our domain model
 */
export const adaptTokenFromSdk = (
	sdkToken: TokenInfoRow,
	totalSupply = '0',
	isStopped = false
): TokenInfo => ({
	address: sdkToken.token,
	owner: sdkToken.tokenOwner,
	// The SDK doesn't have totalSupply directly in TokenInfoRow
	// We'll need to fetch this separately
	totalSupply,
	type: sdkToken.type,
	version: sdkToken.version,
	isStopped
})

/**
 * Formats an avatar type to a user-friendly string
 */
export const formatAvatarType = (type: string): string => {
	if (type === 'CrcV2_RegisterGroup') return 'Group'
	if (type === 'CrcV2_RegisterHuman' || type === 'CrcV1_Signup') return 'Human'
	return type
}

/**
 * Creates a complete avatar stats object from individual parts
 */
export const createAvatarStats = (
	avatar: Avatar,
	v1Token?: TokenInfo,
	v2Token?: TokenInfo,
	v1MigrationAmount?: number
): AvatarStats => ({
	avatar,
	v1Token,
	v2Token,
	v1MigrationAmount,
	formattedAvatarType: formatAvatarType(avatar.type)
})
