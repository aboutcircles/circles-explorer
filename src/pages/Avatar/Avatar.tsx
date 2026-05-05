import { Tab, Tabs } from '@nextui-org/react'
import { useNavigationListener } from 'hooks/useNavigationListener'
import { lazy, Suspense, useEffect, useMemo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useNavigate, useParams } from 'react-router-dom'
import type { Address } from 'viem'

import { BotWarningBanner } from 'components/BotWarningBanner'
import { Error } from 'components/Error'
import { Loader } from 'components/Loader'
import { useProfilesCoordinator } from 'coordinators'
import { useAvatar } from 'domains/avatars/repository'
import {
	useGroupedTrustRelations,
	useInvitations
} from 'domains/trust/repository'
import useBreakpoint from 'hooks/useBreakpoint'
import { EventsTable } from 'shared/EventsTable'
import { Filter } from 'shared/Filter'
import { useProfileStore } from 'stores/useProfileStore'

import { AvatarInfo } from './AvatarInfo'
import { AvatarStats } from './AvatarStats'
import { SimulateTrustForm } from './SimulateTrustForm'
import TokenHolders from './TokenHolders'
import { TrustRelations } from './TrustRelations'

// Use lazy loading for the SocialGraph component since it's heavy
const SocialGraph = lazy(async () => import('./SocialGraph/index'))

// Tab keys must match the URL paths
const TABS = ['events', 'holders', 'trust', 'graph', 'simulate'] as const
type TabKey = (typeof TABS)[number]

export default function Avatar() {
	const { address, tab } = useParams<{ address: string; tab: string }>()
	const {
		isLoading: profilesLoading,
		getBotVerdict,
		loadProfilesForAvatar
	} = useProfilesCoordinator()
	const getProfile = useProfileStore.use.getProfile()
	const { isSmScreen, isMdScreen } = useBreakpoint()
	const navigate = useNavigate()

	// Use the navigation listener hook to handle browser back/forward events
	// and sync URL parameters with the filter store
	useNavigationListener()

	// Check if the avatar is a bot
	const botVerdict = address ? getBotVerdict(address.toLowerCase()) : undefined
	const isBot = botVerdict?.is_bot === true

	// Fetch avatar data using our new repository
	const { data: avatar, isLoading: avatarLoading } = useAvatar(
		address as Address
	)

	// Fetch trust relations using our new repository
	const { data: trustRelations, isLoading: trustLoading } =
		useGroupedTrustRelations(address as Address)

	// Fetch invitations
	const { data: invitations, isLoading: invitationsLoading } = useInvitations(
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

	// Load profiles for the avatar page
	useEffect(() => {
		if (address && avatar && trustRelations && invitations) {
			loadProfilesForAvatar(address, avatar, trustRelations, invitations)
		}
	}, [address, avatar, trustRelations, invitations, loadProfilesForAvatar])

	const isLoading =
		avatarLoading || profilesLoading || trustLoading || invitationsLoading

	return (
		<div className='flex flex-col'>
			<div
				className={`flex ${isMdScreen ? 'flex-row items-start' : 'flex-col items-center'}`}
			>
				<AvatarInfo
					profile={avatar ? getProfile(avatar.id) : null}
					address={address as Address}
				/>
				<AvatarStats address={address as Address} avatar={avatar} />
			</div>

			{isBot ? <BotWarningBanner className='mx-5 mb-4' /> : null}

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
				<Tab key='holders' title='CRC Holders'>
					{avatar ? <TokenHolders avatar={avatar} /> : <Loader />}
				</Tab>
				<Tab key='trust' title='Trust Relations'>
					{address && !isLoading ? (
						<TrustRelations
							trustRelations={trustRelations}
							invitations={invitations}
							isTrustLoading={trustLoading}
							isInvitationsLoading={invitationsLoading}
						/>
					) : (
						<Loader />
					)}
				</Tab>
				<Tab key='graph' title='Trust Graph'>
					{avatar && trustRelations && !isLoading ? (
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-expect-error
						<ErrorBoundary FallbackComponent={Error} fallback={<Error />}>
							<Suspense fallback={<Loader />}>
								<SocialGraph avatar={avatar} trustRelations={trustRelations} />
							</Suspense>
						</ErrorBoundary>
					) : (
						<Loader />
					)}
				</Tab>
				<Tab key='simulate' title='Simulate Trust'>
					{address ? <SimulateTrustForm address={address as Address} /> : null}
				</Tab>
			</Tabs>
		</div>
	)
}
