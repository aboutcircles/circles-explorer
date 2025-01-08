import { useEffect, useState } from 'react'
import type { Address } from 'viem'

import {
	getProfileForAddress,
	type CirclesAvatarFromEnvio
} from 'services/envio/indexer'

import { AvatarInfo } from './AvatarInfo'

// todo
// - trust given list
// - trust received list
// - 3 optional small stats: burn, last mint, invited by
// - total supply
// - profiles from envio

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
		<div className='flex justify-between'>
			<AvatarInfo profile={avatar?.profile} />
		</div>
	)
}

AvatarSection.defaultProps = {
	address: undefined
}
