import { Avatar, Code, Tooltip } from '@nextui-org/react'
import { memo } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { isAddress } from 'viem'

import { useProfiles } from 'hooks/useProfiles'
import { truncateHex } from 'utils/eth'

interface AvatarAddressProperties {
	address: string
	size?: 'lg' | 'md' | 'sm'
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
	className = ''
}: AvatarAddressProperties) {
	const { getProfile } = useProfiles()
	const parameters = useParams<{ tab?: string }>()

	// Use current tab or default to 'events'
	const currentTab = parameters.tab ?? 'events'

	const profile = getProfile(address.toLowerCase())

	if (!isAddress(address)) {
		return <span className={className}>{address}</span>
	}

	const displayName = profile?.name ?? truncateHex(address)
	const tooltipContent = profile?.name
		? `${profile.name} (${truncateHex(address)})`
		: address

	return (
		<RouterLink
			to={`/avatar/${address}/${currentTab}`}
			className='no-underline'
		>
			<Tooltip content={tooltipContent}>
				<div
					className={`flex cursor-pointer items-center ${className}`}
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
		</RouterLink>
	)
}

export const AvatarAddress = memo(AvatarAddressBase)

AvatarAddressBase.defaultProps = {
	className: '',
	size: 'sm'
}
