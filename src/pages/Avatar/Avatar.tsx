import { Tab, Tabs } from '@nextui-org/react'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useNavigate, useParams } from 'react-router-dom'
import type { Address } from 'viem'
import { isAddress } from 'viem'

import { Error } from 'components/Error'
import { Loader } from 'components/Loader'
import useBreakpoint from 'hooks/useBreakpoint'
import { useProfiles } from 'hooks/useProfiles'
import { useSdkTrustRelations } from 'hooks/useSdkTrustRelations'
import { useFetchInvites } from 'services/circlesIndex'
import {
	getProfileForAddress,
	type CirclesAvatarFromEnvio
} from 'services/envio/indexer'
import { EventsTable } from 'shared/EventsTable'
import { Filter } from 'shared/Filter'
import { useProfileStore } from 'stores/useProfileStore'

import { AvatarInfo } from './AvatarInfo'
import { AvatarStats } from './AvatarStats'
import { TrustRelations } from './TrustRelations'

// Use lazy loading for the SocialGraph component since it's heavy
const SocialGraph = lazy(async () => import('./SocialGraph/index'))

// Tab keys must match the URL paths
const TABS = ['events', 'trust', 'graph'] as const
type TabKey = (typeof TABS)[number]

export default function Avatar() {
	const { address, tab } = useParams<{ address: string; tab: string }>()
	const [avatar, setAvatar] = useState<CirclesAvatarFromEnvio | null>()
	const { fetchProfiles, isLoading } = useProfiles()
	const getProfile = useProfileStore.use.getProfile()
	const { isSmScreen } = useBreakpoint()
	const navigate = useNavigate()

	const { data: invitesGiven, refetch: fetchInvites } = useFetchInvites(
		address ?? ''
	)

	const { trustRelations, refetch: fetchTrustRelations } = useSdkTrustRelations(
		address as Address
	)

	// Validate tab and default to 'events' if invalid
	const currentTab = useMemo(
		() => (TABS.includes(tab as TabKey) ? (tab as TabKey) : 'events'),
		[tab]
	)

	// Handle tab change
	const handleTabChange = (key: React.Key) => {
		navigate(`/avatar/${address}/${key}`)
	}

	useEffect(() => {
		// If tab is invalid, redirect to valid tab
		if (tab && !TABS.includes(tab as TabKey)) {
			navigate(`/avatar/${address}/events`, { replace: true })
		}
	}, [tab, address, navigate])

	useEffect(() => {
		const loadAvatarInfo = async (addressToLoad: Address) => {
			setAvatar(null)

			const [avatarInfo, invites, relations] = await Promise.all([
				getProfileForAddress(addressToLoad),
				fetchInvites(),
				fetchTrustRelations()
			])

			// todo: check 0x9484fcaa4c39d68798e3c1b7f4a3d9dc2adc69cd, it has no profile
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!avatarInfo) return

			// use Set to avoid duplicates and later check for cached profiles
			const addresses = new Set()

			addresses.add(avatarInfo.id.toLowerCase())

			if (avatarInfo.invitedBy) {
				addresses.add(avatarInfo.invitedBy.toLowerCase())
			}

			// Add addresses from trust relations
			if (relations.data) {
				for (const relation of [
					...relations.data.given,
					...relations.data.received
				]) {
					addresses.add(relation.address.toLowerCase())
				}
			}

			// Add addresses from invites
			for (const invite of invites.data ?? []) {
				addresses.add(invite.avatar.toLowerCase())
			}

			if (addresses.size > 0) {
				await fetchProfiles([...addresses] as string[])
			}

			setAvatar(avatarInfo)
		}

		if (address && isAddress(address as Address)) {
			void loadAvatarInfo(address as Address)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [address])

	const { isMdScreen } = useBreakpoint()

	return (
		<div className='flex flex-col'>
			<div
				className={`flex ${isMdScreen ? 'flex-row items-start' : 'flex-col items-center'}`}
			>
				{avatar ? <AvatarInfo profile={getProfile(avatar.id)} /> : null}
				{avatar ? <AvatarStats avatar={avatar} /> : <Loader />}
			</div>

			<Tabs
				aria-label='Avatar tabs'
				className='justify-center'
				selectedKey={currentTab}
				onSelectionChange={handleTabChange}
			>
				<Tab key='events' title='Events'>
					{isSmScreen ? (
						<div>
							<Filter className='max-h-[80px]' />
						</div>
					) : null}
					{address ? <EventsTable address={address} /> : null}
				</Tab>
				<Tab key='trust' title='Trust Relations'>
					{avatar && !isLoading ? (
						<TrustRelations
							trustRelations={trustRelations}
							invitesGiven={invitesGiven ?? []}
						/>
					) : (
						<Loader />
					)}
				</Tab>
				<Tab key='graph' title='Trust Graph'>
					{avatar && !isLoading ? (
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-expect-error
						<ErrorBoundary FallbackComponent={Error} fallback={<Error />}>
							<Suspense fallback={<Loader />}>
								<SocialGraph avatar={avatar} />
							</Suspense>
						</ErrorBoundary>
					) : (
						<Loader />
					)}
				</Tab>
			</Tabs>
		</div>
	)
}
