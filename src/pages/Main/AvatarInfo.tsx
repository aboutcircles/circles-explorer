import { Avatar } from '@nextui-org/react'

import type { IPFSData } from 'services/envio/indexer'

export function AvatarInfo({ profile }: { profile?: IPFSData }) {
	return (
		<div className='m-5 text-center'>
			<Avatar
				className='m-auto h-[150px] w-[150px]'
				size='lg'
				showFallback
				src={profile?.previewImageUrl ?? profile?.imageUrl}
			/>

			<h1 className='mt-3 max-w-[200px] break-words'>
				{profile?.name ?? 'Avatar Name'}
			</h1>

			<div className='max-w-[200px] break-words'>{profile?.description}</div>
		</div>
	)
}

AvatarInfo.defaultProps = {
	profile: undefined
}
