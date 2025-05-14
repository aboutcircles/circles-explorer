import { Card, Listbox, ListboxItem } from '@nextui-org/react'
import type { Address } from 'viem'

import { AvatarAddress } from 'shared/AvatarAddress'
import { useProfileStore } from 'stores/useProfileStore'

import { LISTBOX_MAX_HEIGHT, LISTBOX_ITEM_HEIGHT } from './constants'

// Component for displaying invitations
export function InvitationSection({
	invitations,
	searchTerm
}: {
	invitations: { inviter: Address; invited: Address }[]
	searchTerm: string
}) {
	const getProfile = useProfileStore.use.getProfile()

	// Filter invitations based on search term
	const filteredInvitations = searchTerm.trim()
		? invitations.filter((invite) => {
				const inviteAddress = invite.invited.toLowerCase()
				const profile = getProfile(inviteAddress)

				// If profile is not found, return false
				if (!profile) return false

				const name = profile.name ? profile.name.toLowerCase() : ''
				const term = searchTerm.toLowerCase()

				return inviteAddress.includes(term) || name.includes(term)
			})
		: invitations

	return (
		<Card className='flex-1 p-4'>
			<h3 className='mb-2 font-semibold'>
				Invites given: {filteredInvitations.length}
			</h3>
			<Listbox
				className='overflow-auto py-0'
				label='Invites given'
				variant='light'
				isVirtualized
				virtualization={{
					maxListboxHeight: LISTBOX_MAX_HEIGHT,
					itemHeight: LISTBOX_ITEM_HEIGHT
				}}
			>
				{filteredInvitations.length > 0 ? (
					filteredInvitations.map((invite) => (
						<ListboxItem key={invite.invited} textValue={invite.invited}>
							<div className='flex items-center'>
								<AvatarAddress address={invite.invited} size='md' />
							</div>
						</ListboxItem>
					))
				) : (
					<ListboxItem>No invites found</ListboxItem>
				)}
			</Listbox>
		</Card>
	)
}
