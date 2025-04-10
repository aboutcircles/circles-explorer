import { Badge, Card, Tooltip } from '@nextui-org/react'
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
import { AvatarAddress } from 'shared/AvatarAddress'
import { isDeadAddress } from 'utils/eth'

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
							<AvatarAddress
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
		</div>
	)
}
