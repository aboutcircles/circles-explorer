import type { SearchResultProfile } from '@circles-sdk/profiles'
import type { CirclesAvatarFromEnvio } from 'services/envio/indexer'
import type { Profile } from './types'

/**
 * Adapts a profile from the SDK format to our domain format
 */
export const adaptProfileFromSdk = (profile: SearchResultProfile): Profile =>
	// Ensure all required properties are present
	({
		address: profile.address,
		name: profile.name,
		previewImageUrl: profile.previewImageUrl,
		imageUrl: profile.imageUrl,
		description: profile.description,
		CID: profile.CID,
		lastUpdatedAt: profile.lastUpdatedAt,
		registeredName: profile.registeredName,
		location: profile.location
	})

/**
 * Converts an Envio profile to our domain format
 */
export const convertEnvioProfileToProfile = (
	envioProfile: CirclesAvatarFromEnvio
): Profile => ({
	address: envioProfile.id,
	name: envioProfile.profile?.name ?? '',
	previewImageUrl: envioProfile.profile?.previewImageUrl ?? '',
	imageUrl: envioProfile.profile?.imageUrl ?? '',
	description: envioProfile.profile?.description ?? '',
	CID: envioProfile.cidV0,
	lastUpdatedAt: 0,
	registeredName: envioProfile.profile?.name ?? ''
})
