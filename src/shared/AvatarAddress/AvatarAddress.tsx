import { Avatar, Code, Tooltip } from '@nextui-org/react'
import type { KeyboardEvent } from 'react'
import { memo, useCallback } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { isAddress } from 'viem'

import { useProfiles } from 'hooks/useProfiles'
import { truncateHex } from 'utils/eth'

interface AvatarAddressProperties {
	address: string
	size?: 'lg' | 'md' | 'sm'
	onClick?: (address: string) => void
	className?: string
}

// Size mappings
const avatarSizeMap = {
	sm: 'h-6 w-6',
	md: 'h-8 w-8',
	lg: 'h-10 w-10'
}

const textSizeMap = {
	sm: 'text-xs',
	md: 'text-sm',
	lg: 'text-base'
}

function AvatarAddressBase({
	address,
	size = 'sm',
	onClick,
	className = ''
}: AvatarAddressProperties) {
	const { getProfile } = useProfiles()

	const profile = getProfile(address)

	const handleClick = useCallback(() => {
		if (onClick) {
			onClick(address)
		}
	}, [address, onClick])

	if (!isAddress(address)) {
		return <span className={className}>{address}</span>
	}

	const displayName = profile?.name ?? truncateHex(address)
	const tooltipContent = profile?.name
		? `${profile.name} (${truncateHex(address)})`
		: address

	return (
		<Tooltip content={tooltipContent}>
			<div
				className={`flex cursor-pointer items-center ${className}`}
				onClick={handleClick}
				onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
					if (event.key === 'Enter' || event.key === ' ') {
						handleClick()
					}
				}}
				role='button'
				tabIndex={0}
				aria-label={`Address ${truncateHex(address)}`}
			>
				{profile?.previewImageUrl ? (
					<Avatar
						className={`mr-2 ${avatarSizeMap[size]}`}
						size={size}
						src={profile.previewImageUrl}
					/>
				) : (
					<Avatar
						className={`mr-2 ${avatarSizeMap[size]}`}
						size={size}
						src='/icons/avatar.svg'
						classNames={{
							base: 'p-1'
						}}
					/>
				)}
				<Code
					className={`rounded-md border border-gray-200 bg-gray-50 px-2 py-1 ${textSizeMap[size]} max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap`}
				>
					{displayName}
				</Code>
			</div>
		</Tooltip>
	)
}

export const AvatarAddress = memo(AvatarAddressBase)

AvatarAddressBase.defaultProps = {
	className: '',
	onClick: undefined,
	size: 'sm'
}

// Create a link version that uses react-router
export function AvatarAddressLink({
	address,
	size = 'sm',
	className = ''
}: Omit<AvatarAddressProperties, 'onClick'>) {
	return (
		<RouterLink to={`?search=${address}`} className='no-underline'>
			<AvatarAddress address={address} size={size} className={className} />
		</RouterLink>
	)
}
