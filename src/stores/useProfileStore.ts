import type { SearchResultProfile } from '@circles-sdk/profiles'
import { create } from 'zustand'
import { createSelectors } from './createSelectors'

interface ProfileState {
	profiles: Record<string, SearchResultProfile>
	setProfile: (address: string, profile: SearchResultProfile) => void
	setProfiles: (profiles: Record<string, SearchResultProfile>) => void
	getProfile: (address: string) => SearchResultProfile | undefined
}

export const useProfileStore = createSelectors(
	create<ProfileState>((set, get) => ({
		profiles: {},
		setProfile: (address, profile) =>
			set((state) => ({
				profiles: {
					...state.profiles,
					[address.toLowerCase()]: profile
				}
			})),
		setProfiles: (profiles) =>
			set((state) => ({
				profiles: {
					...state.profiles,
					...profiles
				}
			})),
		getProfile: (address) => get().profiles[address.toLowerCase()]
	}))
)
