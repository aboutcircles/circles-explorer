import { Card, Listbox, ListboxItem } from '@nextui-org/react'
import useBreakpoint from 'hooks/useBreakpoint'
import { useCallback, useMemo, useState } from 'react'
import type {
	TrustRelationFromEnvio,
	CirclesAvatarFromEnvio
} from 'services/envio/indexer'
import type { InviteRow } from 'services/circlesIndex'
import { AvatarAddress } from 'shared/AvatarAddress'
import { TrustSearchBox } from 'shared/Search/TrustSearchBox'
import { useProfileStore } from 'stores/useProfileStore'

interface TrustSection {
	label: string
	arrayField: 'trustsGiven' | 'trustsReceived'
	addressField: 'trustee_id' | 'truster_id'
}

const trustSections: TrustSection[] = [
	{
		label: 'Trusts given',
		arrayField: 'trustsGiven',
		addressField: 'trustee_id'
	},
	{
		label: 'Trusts received',
		arrayField: 'trustsReceived',
		addressField: 'truster_id'
	}
]

export function TrustRelations({
	avatar,
	invitesGiven
}: {
	avatar: CirclesAvatarFromEnvio
	invitesGiven: InviteRow[]
}) {
	const { isMdScreen } = useBreakpoint()
	const [searchTerm, setSearchTerm] = useState('')
	const getProfile = useProfileStore.use.getProfile()

	// Filter trust relations based on search term
	const filterTrustRelations = useCallback(
		(
			relations: TrustRelationFromEnvio[],
			addressField: 'trustee_id' | 'truster_id'
		) => {
			if (!searchTerm.trim()) return relations

			const term = searchTerm.toLowerCase()
			return relations.filter((trust) => {
				const address = trust[addressField].toLowerCase()
				const profile = getProfile(address)
				const name = profile?.name ? profile.name.toLowerCase() : ''

				return address.includes(term) || name.includes(term)
			})
		},
		[searchTerm, getProfile]
	)

	// Memoize filtered trust relations
	const filteredTrustSections = useMemo(
		() =>
			trustSections.map((section) => ({
				...section,
				filteredData: filterTrustRelations(
					avatar[section.arrayField],
					section.addressField
				)
			})),
		[avatar, filterTrustRelations]
	)

	// Filter invites based on search term
	const filteredInvites = useMemo(() => {
		if (!searchTerm.trim()) return invitesGiven

		const term = searchTerm.toLowerCase()
		return invitesGiven.filter((invite) => {
			const address = invite.avatar.toLowerCase()
			const profile = getProfile(address)
			const name = profile?.name ? profile.name.toLowerCase() : ''

			return address.includes(term) || name.includes(term)
		})
	}, [searchTerm, getProfile, invitesGiven])

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
				{filteredTrustSections.map((section) => (
					<Card
						key={section.label}
						className={`${isMdScreen ? 'flex-1' : 'w-full'} p-4`}
					>
						<h3 className='mb-2 font-semibold'>
							{section.label}: {section.filteredData.length}
						</h3>
						<Listbox
							className='overflow-auto py-0'
							variant='light'
							isVirtualized
							virtualization={{
								// eslint-disable-next-line @typescript-eslint/no-magic-numbers
								maxListboxHeight: 400,
								// eslint-disable-next-line @typescript-eslint/no-magic-numbers
								itemHeight: 40
							}}
						>
							{section.filteredData.length > 0 ? (
								section.filteredData.map((trust) => (
									<ListboxItem
										key={trust.truster_id + trust.trustee_id + trust.version}
										textValue={`(v${trust.version}) - ${trust[section.addressField]}`}
									>
										<div className='flex items-center'>
											<AvatarAddress
												address={trust[section.addressField]}
												size='md'
											/>
										</div>
									</ListboxItem>
								))
							) : (
								<ListboxItem>No trust relations found</ListboxItem>
							)}
						</Listbox>
					</Card>
				))}

				{/* Third list for invites - placeholder for future implementation */}
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
						isVirtualized
						virtualization={{
							// eslint-disable-next-line @typescript-eslint/no-magic-numbers
							maxListboxHeight: 400,
							// eslint-disable-next-line @typescript-eslint/no-magic-numbers
							itemHeight: 40
						}}
					>
						{filteredInvites.length > 0 ? (
							filteredInvites.map((invite) => (
								<ListboxItem key={invite.avatar}>
									<div className='flex items-center'>
										<AvatarAddress address={invite.avatar} size='md' />
									</div>
								</ListboxItem>
							))
						) : (
							<ListboxItem>No trust relations found</ListboxItem>
						)}
					</Listbox>
				</Card>
			</div>
		</div>
	)
}
