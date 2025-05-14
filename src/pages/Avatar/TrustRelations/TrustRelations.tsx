import { useState } from 'react'

import { Loader } from 'components/Loader'
import type { GroupedTrustRelations, Invitation } from 'domains/trust/types'
import useBreakpoint from 'hooks/useBreakpoint'
import { TrustSearchBox } from 'shared/Search/TrustSearchBox'

import { InvitationSection } from './InvitationSection'
import { TrustSection } from './TrustSection'

export interface TrustRelationsProperties {
	trustRelations?: GroupedTrustRelations
	invitations?: Invitation[]
	isTrustLoading: boolean
	isInvitationsLoading: boolean
}

export function TrustRelations({
	trustRelations,
	invitations,
	isTrustLoading,
	isInvitationsLoading
}: TrustRelationsProperties) {
	const { isMdScreen } = useBreakpoint()
	const [searchTerm, setSearchTerm] = useState('')

	const isLoading = isTrustLoading || isInvitationsLoading

	if (isLoading) return <Loader />
	if (!trustRelations) return null
	if (!invitations) return null

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
				<TrustSection
					title='Trusts given'
					relations={trustRelations.given}
					searchTerm={searchTerm}
				/>

				<TrustSection
					title='Trusts received'
					relations={trustRelations.received}
					searchTerm={searchTerm}
				/>

				{invitations.length > 0 ? (
					<InvitationSection
						invitations={invitations}
						searchTerm={searchTerm}
					/>
				) : null}
			</div>
		</div>
	)
}

TrustRelations.defaultProps = {
	invitations: [],
	trustRelations: {
		given: [],
		received: []
	}
}
