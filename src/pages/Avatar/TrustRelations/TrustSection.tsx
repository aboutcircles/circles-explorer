import { Card, Listbox, ListboxItem } from '@nextui-org/react'

import type { TransformedTrustRelation } from 'domains/trust/types'
import { AvatarAddress } from 'shared/AvatarAddress'
import { useProfileStore } from 'stores/useProfileStore'

import { LISTBOX_ITEM_HEIGHT, LISTBOX_MAX_HEIGHT } from './constants'

interface TrustSectionProperties {
	title: string
	relations: TransformedTrustRelation[]
	searchTerm: string
}

// Extract TrustSection as a separate component
export function TrustSection({
	title,
	relations,
	searchTerm
}: TrustSectionProperties) {
	const getProfile = useProfileStore.use.getProfile()

	// Filter trust relations based on search term
	const filteredRelations = searchTerm.trim()
		? relations.filter((trust) => {
				const trustAddress = trust.address.toLowerCase()
				const profile = getProfile(trustAddress)

				// If profile is not found, return false
				if (!profile) return false

				const name = profile.name ? profile.name.toLowerCase() : ''
				const term = searchTerm.toLowerCase()

				return trustAddress.includes(term) || name.includes(term)
			})
		: relations

	return (
		<Card className='flex-1 p-4'>
			<h3 className='mb-2 font-semibold'>
				{title}: {filteredRelations.length}
			</h3>
			<Listbox
				className='overflow-auto py-0'
				label={title}
				variant='light'
				isVirtualized
				virtualization={{
					maxListboxHeight: LISTBOX_MAX_HEIGHT,
					itemHeight: LISTBOX_ITEM_HEIGHT
				}}
			>
				{filteredRelations.length > 0 ? (
					filteredRelations.map((trust) => (
						<ListboxItem
							key={`${trust.address}-${trust.type}-${trust.versions.join('-')}`}
							textValue={`${trust.address} (v${trust.versions.join(', ')})`}
						>
							<div className='flex items-center justify-between'>
								<AvatarAddress address={trust.address} size='md' />
								{trust.isMutual ? (
									<span className='text-sm text-success'>Mutual</span>
								) : null}
							</div>
						</ListboxItem>
					))
				) : (
					<ListboxItem>No trust relations found</ListboxItem>
				)}
			</Listbox>
		</Card>
	)
}
