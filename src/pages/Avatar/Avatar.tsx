import { useEffect, useState, useMemo, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tabs, Tab, Spinner } from '@nextui-org/react'
import type { Address } from 'viem'
import { isAddress } from 'viem'
import { ErrorBoundary } from 'react-error-boundary'

import { Error } from 'components/Error'
import { useProfiles } from 'hooks/useProfiles'
import {
	getProfileForAddress,
	type CirclesAvatarFromEnvio
} from 'services/envio/indexer'
import logger from 'services/logger'
import { Filter } from 'shared/Filter'
import { EventsTable } from 'shared/EventsTable'
import useBreakpoint from 'hooks/useBreakpoint'

import { AvatarInfo } from './AvatarInfo'
import { AvatarStats } from './AvatarStats'
import { TrustRelations } from './TrustRelations'

/*
todo:
- Loading while profiles are loading
- Setup correct sizes for graph
- Try to make it more circles oriented
- Profiles workaround
- search for trust lists
- search for graph
 */

// Use lazy loading for the SocialGraph component since it's heavy
const SocialGraph = lazy(async () => import('./SocialGraph/index'))

// Tab keys must match the URL paths
const TABS = ['events', 'trust', 'graph'] as const
type TabKey = (typeof TABS)[number]

export default function Avatar() {
	const { address, tab } = useParams<{ address: string; tab: string }>()
	const [avatar, setAvatar] = useState<CirclesAvatarFromEnvio>()
	const { fetchProfiles } = useProfiles()
	const { isSmScreen } = useBreakpoint()
	const navigate = useNavigate()

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
			const avatarInfo = await getProfileForAddress(addressToLoad)

			// todo: check 0x9484fcaa4c39d68798e3c1b7f4a3d9dc2adc69cd, it has no profile
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!avatarInfo) return

			setAvatar(avatarInfo)
			logger.log({ avatarInfo })

			// use Set to avoid duplicates and later check for cached profiles
			const addresses = new Set()

			if (avatarInfo.invitedBy) {
				addresses.add(avatarInfo.invitedBy.toLowerCase())
			}

			for (const trustRelation of avatarInfo.trustsGiven) {
				addresses.add(trustRelation.trustee_id.toLowerCase())
			}
			for (const trustRelation of avatarInfo.trustsReceived) {
				addresses.add(trustRelation.truster_id.toLowerCase())
			}

			if (addresses.size > 0) {
				void fetchProfiles([...addresses] as string[])
			}
		}

		if (address && isAddress(address as Address)) {
			void loadAvatarInfo(address as Address)
		}
		// In the future, handle nickname lookup here
	}, [address, fetchProfiles])

	const { isMdScreen } = useBreakpoint()

	return (
		<div className='flex flex-col'>
			<div
				className={`flex ${isMdScreen ? 'flex-row items-start' : 'flex-col items-center'}`}
			>
				<AvatarInfo profile={avatar?.profile} />
				{avatar ? <AvatarStats avatar={avatar} /> : null}
			</div>

			<Tabs
				aria-label='Avatar tabs'
				className='mt-4'
				selectedKey={currentTab}
				onSelectionChange={handleTabChange}
			>
				<Tab key='events' title='Events'>
					{isSmScreen ? (
						<div>
							<Filter className='max-h-[80px]' />
						</div>
					) : null}
					<EventsTable />
				</Tab>
				<Tab key='trust' title='Trust Relations'>
					{avatar ? <TrustRelations avatar={avatar} /> : null}
				</Tab>
				<Tab key='graph' title='Trust Graph'>
					{avatar ? (
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-expect-error
						<ErrorBoundary FallbackComponent={Error} fallback={<Error />}>
							<Suspense
								fallback={
									<div className='flex h-60 w-full items-center justify-center'>
										<Spinner size='lg' />
									</div>
								}
							>
								<SocialGraph avatar={avatar} />
							</Suspense>
						</ErrorBoundary>
					) : (
						<div className='flex h-60 w-full items-center justify-center'>
							<Spinner size='lg' />
						</div>
					)}
				</Tab>
			</Tabs>
		</div>
	)
}
