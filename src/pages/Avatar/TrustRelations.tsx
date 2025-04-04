import { Card, Listbox, ListboxItem } from '@nextui-org/react'
import type { CirclesAvatarFromEnvio } from 'services/envio/indexer'
import { AvatarAddress } from 'shared/AvatarAddress'
import useBreakpoint from 'hooks/useBreakpoint'

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

export function TrustRelations({ avatar }: { avatar: CirclesAvatarFromEnvio }) {
	const { isMdScreen } = useBreakpoint()

	// In future, when invites data is available, add the third section
	// const invitesGiven = avatar.invitesGiven || []

	return (
		<div
			className={`flex flex-wrap ${isMdScreen ? 'flex-row' : 'flex-col'} gap-4 p-4`}
		>
			{trustSections.map((section) => (
				<Card
					key={section.label}
					className={`${isMdScreen ? 'flex-1' : 'w-full'} p-4`}
				>
					<h3 className='mb-2 font-semibold'>
						{section.label}: {avatar[section.arrayField].length}
					</h3>
					<Listbox
						className='overflow-auto py-0'
						variant='light'
						isVirtualized
						virtualization={{
							// eslint-disable-next-line @typescript-eslint/no-magic-numbers
							maxListboxHeight: 300,
							// eslint-disable-next-line @typescript-eslint/no-magic-numbers
							itemHeight: 40
						}}
					>
						{avatar[section.arrayField].length > 0 ? (
							avatar[section.arrayField].map((trust) => (
								<ListboxItem
									key={trust.truster_id + trust.trustee_id + trust.version}
									textValue={`(v${trust.version}) - ${trust[section.addressField]}`}
								>
									<div className='flex items-center'>
										<AvatarAddress address={trust[section.addressField]} />
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
			<Card className={`${isMdScreen ? 'flex-1' : 'w-full'} p-4`}>
				<h3 className='mb-2 font-semibold'>Invites given: 0</h3>
				<Listbox className='overflow-auto py-0' variant='light'>
					<ListboxItem>No invites data available yet</ListboxItem>
				</Listbox>
			</Card>
		</div>
	)
}
