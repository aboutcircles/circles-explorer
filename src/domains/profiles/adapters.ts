import type { RpcProfile } from 'services/circlesRpc'
import type { Profile } from './types'

/**
 * Adapts a profile from the RPC format to our domain format
 * Since Profile is now RpcProfile, this is essentially a pass-through
 */
export const adaptProfileFromRpc = (profile: RpcProfile): Profile => profile

/**
 * Handles null RPC responses safely
 */
export const adaptNullableProfileFromRpc = (
	profile: RpcProfile | null
): Profile | null => (profile ? adaptProfileFromRpc(profile) : null)
