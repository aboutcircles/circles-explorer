import { Badge, Card, Link, Tooltip } from '@nextui-org/react'
import { toBigInt } from 'ethers'
import { formatUnits, type Address } from 'viem'

import { Loader } from 'components/Loader'
import { Timestamp } from 'components/Timestamp'
import {
	CRC_MIGRATION_DENOMINATION,
	CRC_TOKEN_DECIMALS,
	EXPLORER_URL,
	TWO
} from 'constants/common'
import { formatAvatarType } from 'domains/avatars/adapters'
import { useAvatar } from 'domains/avatars/repository'
import type { Avatar } from 'domains/avatars/types'
import { useAvatarTokenData } from 'domains/tokens/repository'
import { AvatarAddress } from 'shared/AvatarAddress'
import { isDeadAddress } from 'utils/eth'

interface AvatarStatsProperties {
	address: Address
	avatar?: Avatar
}

// Blank stats component for when avatar data fails to load
function BlankAvatarStats() {
	return (
		<div className='m-5'>
			<div className='mb-5 text-center md:text-left'>
				<Card className='mb-2 mr-2 inline-flex w-[240px] flex-row p-4 text-center'>
					<b>Last mint</b>:<span className='pl-1'>n/a</span>
				</Card>

				<Card className='mb-2 mr-2 inline-table flex-row p-4 text-center'>
					<b>Total CRC supply (V1)</b>:<span className='pl-1'>n/a</span>
				</Card>

				<Card className='mb-2 mr-2 inline-table flex-row p-4 text-center'>
					<b>Total CRC supply (V2)</b>:<span className='pl-1'>n/a</span>
				</Card>

				<Card className='mb-2 mr-2 inline-table flex-row p-4 text-center'>
					<b>Avatar type</b>: n/a
				</Card>
			</div>
		</div>
	)
}

export function AvatarStats({
	address,
	avatar: initialAvatar
}: AvatarStatsProperties) {
	// Fetch avatar data
	const {
		data: avatarData,
		isLoading: avatarLoading,
		error: avatarError
	} = useAvatar(address)

	// Fetch token data using our new hook
	const {
		data: tokenData,
		isLoading: tokenLoading,
		error: tokenError
	} = useAvatarTokenData(avatarData ?? initialAvatar)

	const isLoading = avatarLoading || tokenLoading

	if (isLoading) return <Loader />

	// If avatar data fails to load, show blank stats but don't block the page
	if (avatarError ?? !avatarData) {
		return <BlankAvatarStats />
	}

	// If token data fails, continue with avatar data but show empty token stats
	if (tokenError ?? !tokenData) {
		return (
			<div className='m-5'>
				<div className='mb-5 text-center md:text-left'>
					<Card className='mb-2 mr-2 inline-flex w-[240px] flex-row p-4 text-center'>
						<b>Last mint</b>:
						<span className='pl-1'>
							{avatarData.lastMint ? (
								<Timestamp value={avatarData.lastMint} />
							) : (
								'n/a'
							)}
						</span>
					</Card>

					{avatarData.invitedBy && !isDeadAddress(avatarData.invitedBy) ? (
						<Card className='mb-2 mr-2 inline-flex flex-row p-4 text-center align-middle'>
							<b>Invited by: </b>
							<span className='ml-2 inline'>
								<AvatarAddress
									address={avatarData.invitedBy}
									size='sm'
									className='inline'
								/>
							</span>
						</Card>
					) : null}

					{formatAvatarType(avatarData.type) ? (
						<Card className='mb-2 mr-2 inline-table flex-row p-4 text-center'>
							<b>Avatar type</b>: {formatAvatarType(avatarData.type)}
						</Card>
					) : null}
				</div>
			</div>
		)
	}

	const { v1Token, v2Token, v1MigrationAmount } = tokenData

	const formattedAvatarType = formatAvatarType(avatarData.type)

	return (
		<div className='m-5'>
			<div className='mb-5 text-center md:text-left'>
				<Card className='mb-2 mr-2 inline-flex w-[240px] flex-row p-4 text-center'>
					<b>Last mint</b>:
					<span className='pl-1'>
						{avatarData.lastMint ? (
							<Timestamp value={avatarData.lastMint} />
						) : (
							'n/a'
						)}
					</span>
				</Card>

				{v1Token && v1Token.totalSupply !== '0' ? (
					<Badge color={v1Token.isStopped ? 'danger' : 'success'} content=' '>
						<Tooltip
							content={`${Number(v1Token.totalSupply) * CRC_MIGRATION_DENOMINATION} : ${v1Token.isStopped ? 'stopped' : 'active'}`}
						>
							<Link
								target='_blank'
								isExternal
								href={`${EXPLORER_URL}/token/${v1Token.address}`}
							>
								<Card className='mb-2 mr-2 inline-table flex-row p-4 text-center'>
									<b>Total CRC supply (V1)</b>:
									<span className='pl-1'>
										{(
											Number(
												formatUnits(
													toBigInt(v1Token.totalSupply),
													CRC_TOKEN_DECIMALS
												)
											) * CRC_MIGRATION_DENOMINATION
										).toFixed(TWO)}
									</span>
								</Card>
							</Link>
						</Tooltip>
					</Badge>
				) : null}

				{v1MigrationAmount && v1MigrationAmount !== '0.00' ? (
					<Tooltip content={v1MigrationAmount}>
						<Card className='mb-2 mr-2 inline-table flex-row p-4 text-center'>
							<b>V1 {'->'} V2 migrated: </b>:
							<span className='pl-1'>{v1MigrationAmount}</span>
						</Card>
					</Tooltip>
				) : null}

				{v2Token && v2Token.totalSupply !== '0' ? (
					<Badge color={v2Token.isStopped ? 'danger' : 'success'} content=' '>
						<Tooltip
							content={`${v2Token.totalSupply} : ${v2Token.isStopped ? 'stopped' : 'active'}`}
						>
							<Link
								target='_blank'
								isExternal
								href={`${EXPLORER_URL}/token/${v2Token.address}`}
							>
								<Card className='mb-2 mr-2 inline-table flex-row p-4 text-center'>
									<b>Total CRC supply (V2)</b>:
									<span className='pl-1'>
										{Number(
											formatUnits(
												toBigInt(v2Token.totalSupply),
												CRC_TOKEN_DECIMALS
											)
										).toFixed(TWO)}
									</span>
								</Card>
							</Link>
						</Tooltip>
					</Badge>
				) : null}

				{avatarData.invitedBy && !isDeadAddress(avatarData.invitedBy) ? (
					<Card className='mb-2 mr-2 inline-flex flex-row p-4 text-center align-middle'>
						<b>Invited by: </b>
						<span className='ml-2 inline'>
							<AvatarAddress
								address={avatarData.invitedBy}
								size='sm'
								className='inline'
							/>
						</span>
					</Card>
				) : null}

				{/* Destructure formattedAvatarType from statsData */}
				{formattedAvatarType ? (
					<Card className='mb-2 mr-2 inline-table flex-row p-4 text-center'>
						<b>Avatar type</b>: {formattedAvatarType}
					</Card>
				) : null}
			</div>
		</div>
	)
}

// Set default props
AvatarStats.defaultProps = {
	avatar: undefined
}
