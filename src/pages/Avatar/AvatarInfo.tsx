import { Avatar, Code, Tooltip, Button } from '@nextui-org/react'
import { CopyIcon } from '@nextui-org/shared-icons'
import { MIGRATION_CONTRACT } from 'constants/common'
import type { Profile } from 'domains/profiles/types'
import { truncateHex } from 'utils/eth'
import type { Address } from 'viem'
import { useState } from 'react'

interface AvatarInfoProperties {
	profile?: Profile | null
	address?: Address
}

export function AvatarInfo({ profile, address }: AvatarInfoProperties) {
	const avatarImageSource = profile?.previewImageUrl ?? profile?.imageUrl
	const displayName =
		profile?.name ?? (address ? truncateHex(address) : 'Avatar Name')
	const isMigration = address
		? address.toLowerCase() === MIGRATION_CONTRACT.toLowerCase()
		: false
	const [copied, setCopied] = useState(false)

	const COPY_FEEDBACK_DURATION = 2000

	const handleCopyAddress = () => {
		if (address) {
			navigator.clipboard
				.writeText(address)
				.then(() => {
					setCopied(true)
					setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION)
				})
				.catch(() => {
					// Silently fail if clipboard access is not available
				})
		}
	}

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

			{address ? (
				<div className='mt-2 flex items-center justify-center gap-1'>
					<Code className='rounded-md border bg-gray-50 px-2 py-1 text-xs'>
						{truncateHex(address)}
					</Code>
					<Tooltip content={copied ? 'Copied!' : 'Copy address'}>
						<Button
							isIconOnly
							size='sm'
							variant='light'
							aria-label='Copy address'
							onPress={handleCopyAddress}
							className='min-w-6 h-6 w-6'
						>
							<CopyIcon className='h-4 w-4' />
						</Button>
					</Tooltip>
				</div>
			) : null}

			<div className='max-h-[100px] max-w-[200px] overflow-auto break-words text-sm'>
				{profile?.description}
				{isMigration ? (
					<div className='mt-2 inline-flex'>
						<Code className='rounded-md border bg-gray-50 px-2 py-1 text-xs'>
							Migration Contract
						</Code>
					</div>
				) : null}
			</div>
		</div>
	)
}

AvatarInfo.defaultProps = {
	address: undefined,
	profile: undefined
}
