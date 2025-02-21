import { useEffect, useState } from 'react'
import type { Address } from 'viem'

import {
	getProfileForAddress,
	type CirclesAvatarFromEnvio
} from 'services/envio/indexer'
import logger from 'services/logger'

import { AvatarInfo } from './AvatarInfo'
import { AvatarStats } from './AvatarStats'

export function AvatarSection({ address }: { address?: Address }) {
	const [avatar, setAvatar] = useState<CirclesAvatarFromEnvio>()

	useEffect(() => {
		const loadAvatarInfo = async (address_: Address) => {
			const avatarInfo = await getProfileForAddress(address_)

			setAvatar(avatarInfo)

			logger.log({ avatarInfo })
		}

		if (address) {
			void loadAvatarInfo(address)
		}
	}, [address])

	return (
		<div className='flex flex-col items-center md:flex-row md:items-start'>
			<AvatarInfo profile={avatar?.profile} />

			{avatar ? <AvatarStats avatar={avatar} /> : null}
		</div>
	)
}

AvatarSection.defaultProps = {
	address: undefined
}
