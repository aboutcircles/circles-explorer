import type { SearchResultProfile } from '@circles-sdk/profiles'
import type { BotVerdict } from 'domains/bots/types'
import { create } from 'zustand'
import { createSelectors } from './createSelectors'

interface ProfileState {
	profiles: Record<string, SearchResultProfile | null>
	botVerdicts: Record<string, BotVerdict | null>
	isLoading: boolean
	setProfile: (address: string, profile: SearchResultProfile | null) => void
	setProfiles: (profiles: Record<string, SearchResultProfile | null>) => void
	getProfile: (address: string) => SearchResultProfile | null | undefined
	setBotVerdict: (address: string, verdict: BotVerdict | null) => void
	setBotVerdicts: (verdicts: Record<string, BotVerdict | null>) => void
	getBotVerdict: (address: string) => BotVerdict | null | undefined
	setIsLoading: (isLoading: boolean) => void
}

export const useProfileStore = createSelectors(
	create<ProfileState>((set, get) => ({
		profiles: {},
		botVerdicts: {},
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
		setBotVerdict: (address, verdict) =>
			set((state) => ({
				botVerdicts: {
					...state.botVerdicts,
					[address.toLowerCase()]: verdict
				}
			})),
		setBotVerdicts: (verdicts) =>
			set((state) => ({
				botVerdicts: {
					...state.botVerdicts,
					...verdicts
				}
			})),
		getBotVerdict: (address) => get().botVerdicts[address.toLowerCase()],
		setIsLoading: (isLoading) => set({ isLoading })
	}))
)
