import { useEffect, useState } from 'react'
import type { Address } from 'viem'

import {
	getProfileForAddress,
	type CirclesAvatarFromEnvio
} from 'services/envio/indexer'

import { AvatarInfo } from './AvatarInfo'
import { AvatarStats } from './AvatarStats'

// todo
// - total supply

export function AvatarSection({ address }: { address?: Address }) {
	const [avatar, setAvatar] = useState<CirclesAvatarFromEnvio>()

	useEffect(() => {
		const loadAvatarInfo = async (address_: Address) => {
			const avatarInfo = await getProfileForAddress(address_)

			setAvatar(avatarInfo)

			console.log({ avatarInfo })
		}

		if (address) {
			void loadAvatarInfo(address)
		}
	}, [address])

	return (
		<div className='flex'>
			<AvatarInfo profile={avatar?.profile} isVerified={avatar?.isVerified} />

			{avatar ? <AvatarStats avatar={avatar} /> : null}
		</div>
	)
}

AvatarSection.defaultProps = {
	address: undefined
}
