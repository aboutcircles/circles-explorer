import { useState, useEffect } from 'react'
import { Avatar } from '@nextui-org/react'
import type { Profile } from '@circles-sdk/profiles'

import { circlesProfiles } from 'services/circlesData'

export function AvatarInfo({ cidV0 }: { cidV0?: string }) {
	const [profile, setProfile] = useState<Profile>()

	useEffect(() => {
		const loadProfile = async (cidV0_: string) => {
			setProfile(await circlesProfiles.get(cidV0_))
		}

		if (cidV0) {
			void loadProfile(cidV0)
		}
	}, [cidV0])

	return (
		<div className='m-5'>
			<Avatar
				className='mb-3 h-[150px] w-[150px]'
				size='lg'
				showFallback
				src={profile?.previewImageUrl ?? profile?.imageUrl}
			/>

			<h1>{profile?.name ?? 'Avatar Name'}</h1>

			<div>{profile?.description}</div>
		</div>
	)
}

AvatarInfo.defaultProps = {
	cidV0: ''
}
