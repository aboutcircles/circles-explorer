import { Card, Listbox, ListboxItem } from '@nextui-org/react'
import useBreakpoint from 'hooks/useBreakpoint'
import type {
	GroupedTrustRelations,
	TransformedTrustRelation
} from 'hooks/useSdkTrustRelations'
import { useCallback, useMemo, useState } from 'react'
import type { InviteRow } from 'services/circlesIndex'
import { AvatarAddress } from 'shared/AvatarAddress'
import { TrustSearchBox } from 'shared/Search/TrustSearchBox'
import { useProfileStore } from 'stores/useProfileStore'

const LISTBOX_MAX_HEIGHT = 400
const LISTBOX_ITEM_HEIGHT = 40

interface TrustSection {
	label: string
	type: 'given' | 'received'
}

const trustSections: TrustSection[] = [
	{
		label: 'Trusts given',
		type: 'given'
	},
	{
		label: 'Trusts received',
		type: 'received'
	}
]

interface TrustRelationsProperties {
	trustRelations?: GroupedTrustRelations
	invitesGiven: InviteRow[]
}

export function TrustRelations({
	trustRelations,
	invitesGiven
}: TrustRelationsProperties) {
	const { isMdScreen } = useBreakpoint()
	const [searchTerm, setSearchTerm] = useState('')
	const getProfile = useProfileStore.use.getProfile()

	// Filter trust relations based on search term
	const filterTrustRelations = useCallback(
		(relations: TransformedTrustRelation[]) => {
			if (!searchTerm.trim()) return relations

			const term = searchTerm.toLowerCase()
			return relations.filter((trust) => {
				const trustAddress = trust.address.toLowerCase()
				const profile = getProfile(trustAddress)
				const name = profile?.name ? profile.name.toLowerCase() : ''

				return trustAddress.includes(term) || name.includes(term)
			})
		},
		[searchTerm, getProfile]
	)

	// Filter invites based on search term
	const filteredInvites = useMemo(() => {
		if (!searchTerm.trim()) return invitesGiven

		const term = searchTerm.toLowerCase()
		return invitesGiven.filter((invite) => {
			const inviteAddress = invite.avatar.toLowerCase()
			const profile = getProfile(inviteAddress)
			const name = profile?.name ? profile.name.toLowerCase() : ''

			return inviteAddress.includes(term) || name.includes(term)
		})
	}, [searchTerm, getProfile, invitesGiven])

	if (!trustRelations) return null

	return (
		<div className='flex flex-col gap-4 p-4'>
			<div className='flex justify-center'>
				<TrustSearchBox
					onSearch={setSearchTerm}
					placeholder='Search by name or address'
					className='w-full md:w-[320px]'
				/>
			</div>
			<div
				className={`flex flex-wrap ${isMdScreen ? 'flex-row' : 'flex-col'} gap-4`}
			>
				{trustSections.map((section) => (
					<Card
						key={section.label}
						className={`${isMdScreen ? 'flex-1' : 'w-full'} p-4`}
					>
						<h3 className='mb-2 font-semibold'>
							{section.label}:{' '}
							{filterTrustRelations(trustRelations[section.type]).length}
						</h3>
						<Listbox
							className='overflow-auto py-0'
							label={section.label}
							variant='light'
							isVirtualized
							virtualization={{
								maxListboxHeight: LISTBOX_MAX_HEIGHT,
								itemHeight: LISTBOX_ITEM_HEIGHT
							}}
						>
							{trustRelations[section.type].length > 0 ? (
								filterTrustRelations(trustRelations[section.type]).map(
									(trust) => (
										<ListboxItem
											key={`${trust.address}-${trust.type}-${trust.version.join('-')}`}
											textValue={`${trust.address} (v${trust.version.join(', ')})`}
										>
											<div className='flex items-center justify-between'>
												<AvatarAddress address={trust.address} size='md' />
												{trust.isMutual ? (
													<span className='text-sm text-success'>Mutual</span>
												) : null}
											</div>
										</ListboxItem>
									)
								)
							) : (
								<ListboxItem>No trust relations found</ListboxItem>
							)}
						</Listbox>
					</Card>
				))}

				<Card
					key='Invites given'
					className={`${isMdScreen ? 'flex-1' : 'w-full'} p-4`}
				>
					<h3 className='mb-2 font-semibold'>
						Invites given: {filteredInvites.length}
					</h3>
					<Listbox
						className='overflow-auto py-0'
						variant='light'
						label='Invites given'
						isVirtualized
						virtualization={{
							maxListboxHeight: LISTBOX_MAX_HEIGHT,
							itemHeight: LISTBOX_ITEM_HEIGHT
						}}
					>
						{filteredInvites.length > 0 ? (
							filteredInvites.map((invite) => (
								<ListboxItem key={invite.avatar} textValue={invite.avatar}>
									<div className='flex items-center'>
										<AvatarAddress address={invite.avatar} size='md' />
									</div>
								</ListboxItem>
							))
						) : (
							<ListboxItem>No invites found</ListboxItem>
						)}
					</Listbox>
				</Card>
			</div>
		</div>
	)
}

TrustRelations.defaultProps = {
	trustRelations: {
		given: [],
		received: []
	}
}
