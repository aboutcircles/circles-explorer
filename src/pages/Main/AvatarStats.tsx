import {
	Card,
	ListboxItem,
	Listbox,
	Accordion,
	AccordionItem,
	Tooltip
} from '@nextui-org/react'
import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { formatUnits } from 'viem'

import type { CirclesAvatarFromEnvio } from 'services/envio/indexer'
import { isDeadAddress, truncateHex } from 'utils/eth'
import { Timestamp } from 'components/Timestamp'
import { CRC_TOKEN_DECIMALS, TWO } from 'constants/common'

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
	const crcTotalSupply = useMemo(() => {
		const crcBalance = avatar.balances.find(
			(balance) => balance.token.tokenType === 'RegisterHuman'
		)

		if (!crcBalance) return null

		return Number(
			formatUnits(BigInt(crcBalance.token.totalSupply), CRC_TOKEN_DECIMALS)
		)
	}, [avatar])

	return (
		<div className='m-5'>
			<div className='mb-5'>
				<Card className='mr-2 inline-flex flex-row p-4 text-center'>
					<b>Last mint</b>:
					<span className='pl-1'>
						<Timestamp value={Number(avatar.lastMint)} />
					</span>
				</Card>

				{crcTotalSupply ? (
					<Tooltip content={crcTotalSupply}>
						<Card className='mr-2 inline-flex flex-row p-4 text-center'>
							<b>Total CRC supply</b>:
							<span className='pl-1'>{crcTotalSupply.toFixed(TWO)}</span>
						</Card>
					</Tooltip>
				) : null}

				{avatar.invitedBy && !isDeadAddress(avatar.invitedBy) ? (
					<Card className='inline p-4 text-center'>
						Invited by:{' '}
						<RouterLink
							className='inline text-primary'
							to={`?search=${avatar.invitedBy}`}
						>
							{truncateHex(avatar.invitedBy)}
						</RouterLink>
					</Card>
				) : null}

				{avatar.avatarType ? (
					<Card className='mr-2 inline-flex flex-row p-4 text-center'>
						<b>Avatar type</b>:{' '}
						{avatar.avatarType === 'RegisterHuman' ? 'Human' : 'Group'}
					</Card>
				) : null}
			</div>

			<div className='flex'>
				{trustStats.map((stat) => (
					<Card key={stat.label} className='mr-3 w-[460px] p-2'>
						<Accordion>
							<AccordionItem
								title={`${stat.label}: ${avatar[stat.arrayField].length}`}
							>
								<Listbox
									className='py-0'
									variant='light'
									label={`${stat.label}: ${avatar[stat.arrayField].length}`}
								>
									{avatar[stat.arrayField].map((trust) => (
										<ListboxItem
											key={trust.truster_id + trust.trustee_id + trust.version}
										>
											<RouterLink
												className='text-primary'
												to={`?search=${trust[stat.addressField]}`}
											>
												(v{trust.version}) - {trust[stat.addressField]}
											</RouterLink>
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
