import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tabs, Tab } from '@nextui-org/react'
import type { Address } from 'viem'
import { isAddress } from 'viem'

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

export default function Avatar() {
	const { address } = useParams<{ address: string }>()
	const [avatar, setAvatar] = useState<CirclesAvatarFromEnvio>()
	const { fetchProfiles } = useProfiles()
	const { isSmScreen } = useBreakpoint()

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

			<Tabs aria-label='Avatar tabs' className='mt-4'>
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
					<div className='p-4 text-center'>
						Trust Graph visualization is not implemented yet.
					</div>
				</Tab>
			</Tabs>
		</div>
	)
}
