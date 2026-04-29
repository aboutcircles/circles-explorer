import type { AvatarInfo } from '@aboutcircles/sdk-types'
import type { Address } from 'viem'
import type { Avatar } from './types'

/**
 * Adapts an avatar from the SDK format to our domain model.
 * Falls back lastMint to 0 when the indexer omits the timestamp — the caller
 * (avatarRepository.getAvatar) layers a more accurate `lastMint` from
 * PersonalMint / V1 Transfer queries on top.
 */
export const adaptAvatarFromSdk = (sdkAvatar: AvatarInfo): Avatar => ({
	id: sdkAvatar.avatar,
	address: sdkAvatar.avatar,
	type: sdkAvatar.type,
	version: sdkAvatar.version,
	lastMint: sdkAvatar.timestamp ?? 0,
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
	if (
		type === 'CrcV2_RegisterOrganization' ||
		type === 'CrcV1_OrganizationSignup'
	)
		return 'Organization'
	return type
}
