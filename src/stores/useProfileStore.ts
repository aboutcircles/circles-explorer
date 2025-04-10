import type { SearchResultProfile } from '@circles-sdk/profiles'
import { create } from 'zustand'
import { createSelectors } from './createSelectors'

interface ProfileState {
	profiles: Record<string, SearchResultProfile | null>
	isLoading: boolean
	setProfile: (address: string, profile: SearchResultProfile | null) => void
	setProfiles: (profiles: Record<string, SearchResultProfile | null>) => void
	getProfile: (address: string) => SearchResultProfile | null | undefined
	setIsLoading: (isLoading: boolean) => void
}

export const useProfileStore = createSelectors(
	create<ProfileState>((set, get) => ({
		profiles: {},
		isLoading: false,
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
		getProfile: (address) => get().profiles[address.toLowerCase()],
		setIsLoading: (isLoading) => set({ isLoading })
	}))
)
