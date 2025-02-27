import {
	Accordion,
	AccordionItem,
	Badge,
	Card,
	Listbox,
	ListboxItem,
	Tooltip
} from '@nextui-org/react'
import { toBigInt } from 'ethers'
import { useMemo } from 'react'
import { formatUnits, type Address } from 'viem'

import { Timestamp } from 'components/Timestamp'
import { CRC_TOKEN_DECIMALS, TWO } from 'constants/common'
import {
	useFetchCrcV1TotalSupply,
	useFetchCrcV2TokenStopped,
	useFetchCrcV2TotalSupply
} from 'services/circlesIndex'
import type { CirclesAvatarFromEnvio } from 'services/envio/indexer'
import { useCrcV1TokenStopped } from 'services/viemClient'
import { AvatarAddressLink } from 'shared/AvatarAddress'
import { isDeadAddress } from 'utils/eth'

interface TrustStat {
	label: string
	arrayField: 'trustsGiven' | 'trustsReceived'
	addressField: 'trustee_id' | 'truster_id'
}

const trustStats: TrustStat[] = [
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

export function AvatarStats({ avatar }: { avatar: CirclesAvatarFromEnvio }) {
	const { data: crcV2TokenStoppedData } = useFetchCrcV2TokenStopped(avatar.id)
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const crcV2Stopped = Boolean(crcV2TokenStoppedData?.rows?.length)

	const { data: crcV1TotalSupply } = useFetchCrcV1TotalSupply(avatar.id)
	const { data: crcV2TotalSupply } = useFetchCrcV2TotalSupply(avatar.id)

	const { data: crcV1TokenStoppedData } = useCrcV1TokenStopped(
		crcV1TotalSupply?.tokenAddress as Address
	)

	const avatarType = useMemo(() => {
		switch (avatar.avatarType) {
			case 'RegisterGroup': {
				return 'Group'
			}
			case 'RegisterHuman': {
				return 'Human'
			}
			default: {
				return avatar.avatarType
			}
		}
	}, [avatar.avatarType])

	return (
		<div className='m-5'>
			<div className='mb-5 text-center md:text-left'>
				<Card className='mb-2 mr-2 inline-flex w-[240px] flex-row p-4 text-center'>
					<b>Last mint</b>:
					<span className='pl-1'>
						{avatar.lastMint ? (
							<Timestamp value={Number(avatar.lastMint)} />
						) : (
							'n/a'
						)}
					</span>
				</Card>

				{crcV1TotalSupply ? (
					<Badge
						color={crcV1TokenStoppedData ? 'danger' : 'success'}
						content=' '
					>
						<Tooltip
							content={`${crcV1TotalSupply.totalSupply} : ${crcV1TokenStoppedData ? 'stopped' : 'active'}`}
						>
							<Card className='mb-2 mr-2 inline-table flex-row p-4 text-center'>
								<b>Total CRC supply (V1)</b>:
								<span className='pl-1'>
									{Number(
										formatUnits(
											toBigInt(crcV1TotalSupply.totalSupply),
											CRC_TOKEN_DECIMALS
										)
									).toFixed(TWO)}
								</span>
							</Card>
						</Tooltip>
					</Badge>
				) : null}

				{crcV2TotalSupply ? (
					<Badge color={crcV2Stopped ? 'danger' : 'success'} content=' '>
						<Tooltip
							content={`${crcV2TotalSupply.totalSupply} : ${crcV2Stopped ? 'stopped' : 'active'}`}
						>
							<Card className='mb-2 mr-2 inline-table flex-row p-4 text-center'>
								<b>Total CRC supply (V2)</b>:
								<span className='pl-1'>
									{Number(
										formatUnits(
											toBigInt(crcV2TotalSupply.totalSupply),
											CRC_TOKEN_DECIMALS
										)
									).toFixed(TWO)}
								</span>
							</Card>
						</Tooltip>
					</Badge>
				) : null}

				{avatar.invitedBy && !isDeadAddress(avatar.invitedBy) ? (
					<Card className='mb-2 mr-2 inline-flex flex-row p-4 text-center align-middle'>
						<b>Invited by: </b>
						<span className='ml-2 inline'>
							<AvatarAddressLink
								address={avatar.invitedBy}
								size='sm'
								className='inline'
							/>
						</span>
					</Card>
				) : null}

				{avatar.avatarType ? (
					<Card className='mb-2 mr-2 inline-table flex-row p-4 text-center'>
						<b>Avatar type</b>: {avatarType}
					</Card>
				) : null}
			</div>

			<div className='flex flex-wrap justify-center md:justify-start'>
				{trustStats.map((stat) => (
					<Card key={stat.label} className='mb-2 mr-2 w-[240px] p-2'>
						<Accordion>
							<AccordionItem
								title={`${stat.label}: ${avatar[stat.arrayField].length}`}
							>
								<Listbox
									className='overflow-auto py-0'
									variant='light'
									label={`${stat.label}: ${avatar[stat.arrayField].length}`}
									isVirtualized
									virtualization={{
										// eslint-disable-next-line @typescript-eslint/no-magic-numbers
										maxListboxHeight: 200,
										// eslint-disable-next-line @typescript-eslint/no-magic-numbers
										itemHeight: 40
									}}
								>
									{avatar[stat.arrayField].map((trust) => (
										<ListboxItem
											key={trust.truster_id + trust.trustee_id + trust.version}
											textValue={`(v${trust.version}) - ${trust[stat.addressField]}`}
										>
											<div className='flex items-center'>
												<AvatarAddressLink address={trust[stat.addressField]} />
											</div>
										</ListboxItem>
									))}
								</Listbox>
							</AccordionItem>
						</Accordion>
					</Card>
				))}
			</div>
		</div>
	)
}
