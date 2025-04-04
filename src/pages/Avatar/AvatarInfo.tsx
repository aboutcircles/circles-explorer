import { Avatar } from '@nextui-org/react'

import type { IPFSData } from 'services/envio/indexer'

export function AvatarInfo({ profile }: { profile?: IPFSData }) {
	const avatarImageSource = profile?.previewImageUrl ?? profile?.imageUrl

	return (
		<div className='m-5 text-center'>
			{avatarImageSource ? (
				<Avatar
					className='m-auto h-[150px] w-[150px]'
					size='lg'
					showFallback
					src={avatarImageSource}
				/>
			) : (
				<Avatar
					src='/icons/avatar.svg'
					className='m-auto h-[150px] w-[150px]'
					size='lg'
					classNames={{
						base: 'p-5'
					}}
				/>
			)}

			<h1 className='mt-3 max-h-[100px] max-w-[200px] overflow-auto break-words'>
				{profile?.name ?? 'Avatar Name'}
			</h1>

			<div className='max-h-[100px] max-w-[200px] overflow-auto break-words text-sm'>
				{profile?.description}
			</div>
		</div>
	)
}

AvatarInfo.defaultProps = {
	profile: undefined
}
