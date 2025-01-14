import { Avatar, Badge } from '@nextui-org/react'

import type { IPFSData } from 'services/envio/indexer'

function CheckIconImage() {
	return <img src='/icons/check.svg' className='fill-green-500' alt='Check' />
}

const withBadge = (Component: unknown) =>
	function (properties: unknown) {
		return (
			<Badge
				isOneChar
				color='success'
				content={<CheckIconImage />}
				placement='bottom-right'
			>
				{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
				{/* @ts-expect-error */}
				<Component {...properties} />
			</Badge>
		)
	}

export function AvatarInfo({
	profile,
	isVerified
}: {
	profile?: IPFSData
	isVerified?: boolean
}) {
	const AvatarWithBadge = isVerified ? withBadge(Avatar) : Avatar

	return (
		<div className='m-5 text-center'>
			<AvatarWithBadge
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
	isVerified: false,
	profile: undefined
}
