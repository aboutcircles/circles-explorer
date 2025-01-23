import {
	Card,
	ListboxItem,
	Listbox,
	Accordion,
	AccordionItem,
	Tooltip,
	Badge
} from '@nextui-org/react'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { formatUnits, type Address } from 'viem'

import type { CirclesAvatarFromEnvio } from 'services/envio/indexer'
import { isDeadAddress, truncateHex } from 'utils/eth'
import { Timestamp } from 'components/Timestamp'
import { CRC_TOKEN_DECIMALS, TWO } from 'constants/common'
import { getCrcV1TokenStopped } from 'services/viemClient'
import { useFetchCrcV2TokenStopped } from 'services/circlesIndex'
import logger from 'services/logger'

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
	const [crcV1Stopped, setCrcV1Stopped] = useState<boolean | null>(null)

	const { data } = useFetchCrcV2TokenStopped(avatar.id)
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const crcV2Stopped = Boolean(data?.rows?.length)

	const crcTotalSupply = useMemo(() => {
		const crcBalanceV2 = avatar.balances.find(
			(balance) => balance.token.tokenType === 'RegisterHuman'
		)
		const crcBalanceV1 = avatar.balances.find(
			(balance) => balance.token.tokenType === 'Signup'
		)

		if (crcBalanceV1) {
			getCrcV1TokenStopped(crcBalanceV1.token.id as Address)
				.then((stopped) => setCrcV1Stopped(stopped as boolean))
				.catch((error: unknown) => logger.error(error))
		}

		return {
			v1: crcBalanceV1
				? Number(
						formatUnits(
							BigInt(crcBalanceV1.token.totalSupply),
							CRC_TOKEN_DECIMALS
						)
					)
				: null,
			v2: crcBalanceV2
				? Number(
						formatUnits(
							BigInt(crcBalanceV2.token.totalSupply),
							CRC_TOKEN_DECIMALS
						)
					)
				: null
		}
	}, [avatar])

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
						<Timestamp value={Number(avatar.lastMint)} />
					</span>
				</Card>

				{crcTotalSupply.v1 ? (
					<Badge color={crcV1Stopped ? 'danger' : 'success'} content=' '>
						<Tooltip
							content={`${crcTotalSupply.v1} : ${crcV1Stopped ? 'stopped' : 'active'}`}
						>
							<Card className='mb-2 mr-2 inline-table flex-row p-4 text-center'>
								<b>Total CRC supply (V1)</b>:
								<span className='pl-1'>{crcTotalSupply.v1.toFixed(TWO)}</span>
							</Card>
						</Tooltip>
					</Badge>
				) : null}

				{crcTotalSupply.v2 ? (
					<Badge color={crcV2Stopped ? 'danger' : 'success'} content=' '>
						<Tooltip
							content={`${crcTotalSupply.v2} : ${crcV2Stopped ? 'stopped' : 'active'}`}
						>
							<Card className='mb-2 mr-2 inline-table flex-row p-4 text-center'>
								<b>Total CRC supply (V2)</b>:
								<span className='pl-1'>{crcTotalSupply.v2.toFixed(TWO)}</span>
							</Card>
						</Tooltip>
					</Badge>
				) : null}

				{avatar.invitedBy && !isDeadAddress(avatar.invitedBy) ? (
					<Card className='mb-2 mr-2 inline-table p-4 text-center'>
						<b>Invited by: </b>
						<RouterLink
							className='inline text-primary'
							to={`?search=${avatar.invitedBy}`}
						>
							{truncateHex(avatar.invitedBy)}
						</RouterLink>
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
											<RouterLink
												className='text-primary'
												to={`?search=${trust[stat.addressField]}`}
											>
												(v{trust.version}) -{' '}
												{truncateHex(trust[stat.addressField])}
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
