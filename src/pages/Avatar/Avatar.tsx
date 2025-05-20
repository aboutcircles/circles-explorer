import { Tab, Tabs } from '@nextui-org/react'
import { lazy, Suspense, useEffect, useMemo, type ComponentProps } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useNavigate, useParams } from 'react-router-dom'
import type { Address } from 'viem'
import { isAddress } from 'viem'

import { BotWarningBanner } from 'components/BotWarningBanner'
import { Error } from 'components/Error'
import { Loader } from 'components/Loader'
import { useAvatar } from 'domains/avatars/repository'
import {
	useGroupedTrustRelations,
	useInvitations
} from 'domains/trust/repository'
import useBreakpoint from 'hooks/useBreakpoint'
import { useProfiles } from 'hooks/useProfiles'
import { EventsTable } from 'shared/EventsTable'
import { Filter } from 'shared/Filter'
import { useProfileStore } from 'stores/useProfileStore'

import { AvatarInfo } from './AvatarInfo'
import { AvatarStats } from './AvatarStats'
import { TrustRelations } from './TrustRelations'

/*
todo:
- totalSupply (refactor)
- profiles repository
- coordinator for fetch all required repos in once\
- graph
 */

// Use lazy loading for the SocialGraph component since it's heavy
const SocialGraph = lazy(async () => import('./SocialGraph/index'))

// Tab keys must match the URL paths
const TABS = ['events', 'trust', 'graph'] as const
type TabKey = (typeof TABS)[number]

export default function Avatar() {
	const { address, tab } = useParams<{ address: string; tab: string }>()
	const {
		fetchProfiles,
		isLoading: profilesLoading,
		getBotVerdict
	} = useProfiles()
	const getProfile = useProfileStore.use.getProfile()
	const { isSmScreen, isMdScreen } = useBreakpoint()
	const navigate = useNavigate()

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

	useEffect(() => {
		const loadProfiles = async () => {
			if (!address || !isAddress(address as Address)) return
			if (!avatar || !trustRelations || !invitations) return

			// use Set to avoid duplicates and later check for cached profiles
			const addresses = new Set<string>()

			// Add the avatar address
			addresses.add(address.toLowerCase())

			// Add invited by address if available
			if (avatar.invitedBy) {
				addresses.add(avatar.invitedBy.toLowerCase())
			}

			// Add addresses from trust relations
			for (const relation of [
				...trustRelations.given,
				...trustRelations.received
			]) {
				addresses.add(relation.address.toLowerCase())
			}

			// Add addresses from invites
			for (const invite of invitations) {
				addresses.add(invite.avatar.toLowerCase())
			}

			if (addresses.size > 0) {
				void fetchProfiles([...addresses])
			}
		}

		void loadProfiles()
	}, [address, avatar, trustRelations, invitations, fetchProfiles])

	const isLoading =
		avatarLoading || profilesLoading || trustLoading || invitationsLoading

	return (
		<div className='flex flex-col'>
			<div
				className={`flex ${isMdScreen ? 'flex-row items-start' : 'flex-col items-center'}`}
			>
				{avatar ? <AvatarInfo profile={getProfile(avatar.id)} /> : null}
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
					{avatar && !isLoading ? (
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-expect-error
						<ErrorBoundary FallbackComponent={Error} fallback={<Error />}>
							<Suspense fallback={<Loader />}>
								{/* Cast avatar to the type expected by SocialGraph (remove later) */}
								<SocialGraph
									avatar={
										avatar as unknown as ComponentProps<
											typeof SocialGraph
										>['avatar']
									}
								/>
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
