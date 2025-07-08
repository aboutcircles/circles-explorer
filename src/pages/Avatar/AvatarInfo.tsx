import { Avatar } from '@nextui-org/react'
import type { Profile } from 'domains/profiles/types'
import { truncateHex } from 'utils/eth'
import type { Address } from 'viem'

interface AvatarInfoProperties {
	profile?: Profile | null
	address?: Address
}

export function AvatarInfo({ profile, address }: AvatarInfoProperties) {
	const avatarImageSource = profile?.previewImageUrl ?? profile?.imageUrl
	const displayName =
		profile?.name ?? (address ? truncateHex(address) : 'Avatar Name')

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
				{displayName}
			</h1>

			<div className='max-h-[100px] max-w-[200px] overflow-auto break-words text-sm'>
				{profile?.description}
			</div>
		</div>
	)
}

AvatarInfo.defaultProps = {
	address: undefined,
	profile: undefined
}
