import { useEffect, useState } from 'react'
import type { Address } from 'viem'

import useBreakpoint from 'hooks/useBreakpoint'
import { useProfiles } from 'hooks/useProfiles'
import {
	getProfileForAddress,
	type CirclesAvatarFromEnvio
} from 'services/envio/indexer'
import logger from 'services/logger'

import { AvatarInfo } from './AvatarInfo'
import { AvatarStats } from './AvatarStats'

export function AvatarSection({ address }: { address?: Address }) {
	const [avatar, setAvatar] = useState<CirclesAvatarFromEnvio>()
	const { fetchProfiles } = useProfiles()

	useEffect(() => {
		const loadAvatarInfo = async (address_: Address) => {
			const avatarInfo = await getProfileForAddress(address_)

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

		if (address) {
			void loadAvatarInfo(address)
		}
	}, [address, fetchProfiles])

	const { isMdScreen } = useBreakpoint()

	return (
		<div
			className={`flex ${isMdScreen ? 'flex-row items-start' : 'flex-col items-center'}`}
		>
			<AvatarInfo profile={avatar?.profile} />

			{avatar ? <AvatarStats avatar={avatar} /> : null}
		</div>
	)
}

AvatarSection.defaultProps = {
	address: undefined
}
