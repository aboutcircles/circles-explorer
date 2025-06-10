import type { SearchResultProfile } from '@circles-sdk/profiles'
import type { Address } from 'viem'

/**
 * Represents a profile with user information
 */
export type Profile = SearchResultProfile

/**
 * Repository interface for profile-related operations
 */
export interface ProfilesRepository {
	/**
	 * Get a single profile by address
	 */
	getProfile: (address: Address) => Promise<Profile | null>

	/**
	 * Get multiple profiles by addresses
	 */
	getProfiles: (addresses: Address[]) => Promise<Record<string, Profile | null>>

	/**
	 * Search profiles by query string
	 */
	searchProfiles: (query: string) => Promise<Profile[]>
}
