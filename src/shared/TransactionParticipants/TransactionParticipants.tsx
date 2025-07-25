import type { ReactElement } from 'react'

import { avatarFields } from 'constants/avatarFields'
import { DEAD_ADDRESS } from 'constants/common'
import { AvatarAddress } from 'shared/AvatarAddress'
import type { Event } from 'types/events'

const MAX_AVATARS_DISPLAY = 5

// Helper function to collect unique avatars from events
const collectUniqueAvatars = (eventList: Event[]): string[] => {
	const uniqueAddresses = new Set<string>()

	for (const event of eventList) {
		for (const field of avatarFields) {
			const value = (event as unknown as Record<string, unknown>)[field]
			if (value && typeof value === 'string' && value !== DEAD_ADDRESS) {
				uniqueAddresses.add(value)
			}
		}
	}

	return [...uniqueAddresses]
}

interface TransactionParticipantsProperties {
	events: Event[]
	className?: string
	size?: 'lg' | 'md' | 'sm'
	isAddressVisible?: boolean
}

/**
 * Shared component to display transaction participants with their avatar images
 * Extracts unique addresses from events and displays them as avatar components
 */
export function TransactionParticipants({
	events,
	className = '',
	size = 'sm',
	isAddressVisible = false
}: TransactionParticipantsProperties): ReactElement {
	const uniqueAvatars = collectUniqueAvatars(events)

	if (uniqueAvatars.length === 0) {
		return <div className={className}>No participants</div>
	}

	return (
		<div className={`flex items-center space-x-1 ${className}`}>
			{uniqueAvatars.slice(0, MAX_AVATARS_DISPLAY).map((address) => (
				<AvatarAddress
					key={address}
					address={address}
					className='mr-1'
					size={size}
					isAddressVisible={isAddressVisible}
				/>
			))}
			{uniqueAvatars.length > MAX_AVATARS_DISPLAY && (
				<span className='text-xs text-gray-500'>
					+{uniqueAvatars.length - MAX_AVATARS_DISPLAY}
				</span>
			)}
		</div>
	)
}

TransactionParticipants.defaultProps = {
	className: '',
	isAddressVisible: false,
	size: 'sm'
}
