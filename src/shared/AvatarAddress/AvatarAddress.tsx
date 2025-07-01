import { Avatar, Code, Tooltip } from '@nextui-org/react'
import { memo } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { isAddress } from 'viem'

import { BotLabel } from 'components/BotLabel'
import { useProfilesCoordinator } from 'coordinators'
import { truncateHex } from 'utils/eth'

interface AvatarAddressProperties {
	address: string
	size?: 'lg' | 'md' | 'sm'
	className?: string
	isAddressVisible?: boolean
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
	className = '',
	isAddressVisible = true
}: AvatarAddressProperties) {
	const { getProfile, getBotVerdict } = useProfilesCoordinator()
	const parameters = useParams<{ tab?: string }>()

	// Use current tab or default to 'events'
	const currentTab = parameters.tab ?? 'events'

	const profile = getProfile(address.toLowerCase())
	const botVerdict = getBotVerdict(address.toLowerCase())
	const isBot = botVerdict?.is_bot === true

	if (!isAddress(address)) {
		return <span className={className}>{address}</span>
	}

	const displayAddress =
		size === 'sm' || size === 'md' ? truncateHex(address) : address
	const displayName =
		profile?.name === '' ? displayAddress : profile?.name ?? displayAddress
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
							className={`${isAddressVisible ? 'mr-2' : ''} ${avatarSizeMap[size]}`}
							size={size}
							src={profile.previewImageUrl}
						/>
					) : (
						<Avatar
							className={`${isAddressVisible ? 'mr-2' : ''} ${avatarSizeMap[size]}`}
							size={size}
							src='/icons/avatar.svg'
							classNames={{
								base: 'p-1'
							}}
						/>
					)}
					{isBot ? <BotLabel className='mr-1' /> : null}
					{isAddressVisible ? (
						<Code
							className={`rounded-md border ${isBot ? 'border-yellow-600/20' : 'border-gray-200'} ${isBot ? 'bg-yellow-50/30' : 'bg-gray-50'} px-2 py-1 ${textSizeMap[size]} ${size === 'sm' ? 'max-w-[100px]' : 'max-w-[250px]'} overflow-hidden text-ellipsis whitespace-nowrap`}
						>
							{displayName}
						</Code>
					) : null}
				</div>
			</Tooltip>
		</RouterLink>
	)
}

export const AvatarAddress = memo(AvatarAddressBase)

AvatarAddressBase.defaultProps = {
	className: '',
	isAddressVisible: true,
	size: 'sm'
}
