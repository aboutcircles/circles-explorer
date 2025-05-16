import type { AvatarRow } from '@circles-sdk/data/dist/rows/avatarRow'
import type { Address } from 'viem'
import type { Avatar } from './types'

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
 * Formats an avatar type to a user-friendly string
 */
export const formatAvatarType = (type: string): string => {
	if (type === 'CrcV2_RegisterGroup') return 'Group'
	if (type === 'CrcV2_RegisterHuman' || type === 'CrcV1_Signup') return 'Human'
	return type
}
