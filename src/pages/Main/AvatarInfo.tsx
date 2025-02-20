import { Avatar } from '@nextui-org/react'

import type { IPFSData } from 'services/envio/indexer'

export function AvatarInfo({ profile }: { profile?: IPFSData }) {
	return (
		<div className='m-5 text-center'>
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
	profile: undefined
}
