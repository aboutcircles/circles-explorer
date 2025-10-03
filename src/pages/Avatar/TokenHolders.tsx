import { Card, Tooltip } from '@nextui-org/react'
import { useEffect, type ReactElement } from 'react'
import { formatUnits } from 'viem'

import { Timestamp } from 'components/Timestamp'
import {
	VirtualizedTable,
	type Key,
	type Row
} from 'components/VirtualizedTable'
import { CRC_TOKEN_DECIMALS, ONE } from 'constants/common'
import { useProfilesCoordinator } from 'coordinators'
import type { Avatar } from 'domains/avatars/types'
import { useTokenHoldersV1, useTokenHoldersV2 } from 'domains/tokens/repository'
import type { TokenHolder } from 'domains/tokens/types'
import { AvatarAddress } from 'shared/AvatarAddress'

interface TokenHoldersProperties {
	avatar?: Avatar
}

const HOLDERS_LIMIT = 1000
const DECIMALS = 2
const PERCENT_TOOLTIP_PRECISION = 6

// Row mapping helper for tables
function toRows(holders?: TokenHolder[]): Row[] {
	return (
		holders?.map((h, index) => ({
			key: `${h.account}-${index}`,
			rank: index + ONE,
			account: h.account,
			demurraged: h.circlesDemurraged,
			total: h.circlesTotal,
			share: h.sharePercent ?? 0,
			lastActivity: h.lastActivity,
			rawDem: h.demurragedTotalBalance,
			rawTotal: h.totalBalance
		})) ?? []
	)
}

export default function TokenHolders({
	avatar
}: TokenHoldersProperties): ReactElement {
	const tokenAddressV2 = avatar?.tokenId
	const tokenAddressV1 = avatar?.v1Token
	const { fetchProfiles } = useProfilesCoordinator()

	// Call hooks unconditionally; fetch is gated by `enabled` inside hooks
	const {
		data: holdersV2,
		isLoading: isLoadingV2,
		error: errorV2
	} = useTokenHoldersV2(tokenAddressV2, HOLDERS_LIMIT)

	const {
		data: holdersV1,
		isLoading: isLoadingV1,
		error: errorV1
	} = useTokenHoldersV1(tokenAddressV1, HOLDERS_LIMIT)

	// Preload profiles for holder accounts when data arrives (names/avatars in AvatarAddress)
	useEffect(() => {
		const addresses: string[] = []
		if (holdersV2 && holdersV2.length > 0) {
			addresses.push(...holdersV2.map((h) => h.account.toLowerCase()))
		}
		if (holdersV1 && holdersV1.length > 0) {
			addresses.push(...holdersV1.map((h) => h.account.toLowerCase()))
		}
		if (addresses.length > 0) {
			void fetchProfiles(addresses)
		}
	}, [holdersV1, holdersV2, fetchProfiles])

	// If avatar has neither V2 nor V1 token, show friendly message
	if (!tokenAddressV2 && !tokenAddressV1) {
		return (
			<div className='m-5'>
				<Card className='inline-flex flex-row p-4 text-center'>
					This avatar has no CRC tokens.
				</Card>
			</div>
		)
	}

	const columns = [
		{ key: 'rank', label: '#' },
		{ key: 'account', label: 'Holder' },
		{ key: 'demurraged', label: 'Demurraged' },
		{ key: 'total', label: 'Total' },
		{ key: 'share', label: 'Share (%)' },
		{ key: 'lastActivity', label: 'Last Activity' }
	]

	function renderBalanceCell(
		value: number,
		raw: string
	): ReactElement | string {
		const display = Number(value || 0).toFixed(DECIMALS)
		let full: string
		try {
			full = formatUnits(BigInt(raw || '0'), CRC_TOKEN_DECIMALS)
		} catch {
			full = String(value)
		}
		return (
			<Tooltip content={full} size='sm'>
				{display}
			</Tooltip>
		)
	}

	const renderCell = (
		row: Row,
		columnKey: Key
	): ReactElement | number | string => {
		switch (columnKey) {
			case 'rank': {
				return Number(row.rank as number)
			}
			case 'account': {
				return <AvatarAddress address={String(row.account)} size='sm' />
			}
			case 'demurraged': {
				return renderBalanceCell(
					Number(row.demurraged || 0),
					String(row.rawDem || '0')
				)
			}
			case 'total': {
				return renderBalanceCell(
					Number(row.total || 0),
					String(row.rawTotal || '0')
				)
			}
			case 'share': {
				const shareValue = Number(row.share)
				const shareNumber = Number.isFinite(shareValue) ? shareValue : 0
				return (
					<Tooltip
						content={`${shareNumber.toFixed(PERCENT_TOOLTIP_PRECISION)}%`}
						size='sm'
					>
						{`${shareNumber.toFixed(DECIMALS)}%`}
					</Tooltip>
				)
			}
			case 'lastActivity': {
				return <Timestamp value={Number(row.lastActivity)} />
			}
			default: {
				// Fallback to raw value if any
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return row[String(columnKey)]
			}
		}
	}

	const rowsV2: Row[] = toRows(holdersV2)
	const rowsV1: Row[] = toRows(holdersV1)

	return (
		<div className='m-5 space-y-8'>
			{tokenAddressV2 ? (
				<div className='space-y-3'>
					<h3 className='text-base font-semibold'>CRC V2 Holders</h3>
					{errorV2 ? (
						<Card className='inline-flex flex-row p-4 text-center text-danger-600'>
							Failed to load CRC V2 holders.
						</Card>
					) : (
						<VirtualizedTable
							ariaLabel='CRC V2 Token Holders'
							columns={columns}
							rows={rowsV2}
							renderCell={renderCell}
							isLoading={isLoadingV2}
							topContent={
								<div className='flex items-center justify-between'>
									<div className='text-sm text-gray-600'>
										Holders V2: {rowsV2.length}
									</div>
								</div>
							}
						/>
					)}
				</div>
			) : null}

			{tokenAddressV1 ? (
				<div className='space-y-3'>
					<h3 className='text-base font-semibold'>CRC V1 Holders</h3>
					{errorV1 ? (
						<Card className='inline-flex flex-row p-4 text-center text-danger-600'>
							Failed to load CRC V1 holders.
						</Card>
					) : (
						<VirtualizedTable
							ariaLabel='CRC V1 Token Holders'
							columns={columns}
							rows={rowsV1}
							renderCell={renderCell}
							isLoading={isLoadingV1}
							topContent={
								<div className='flex items-center justify-between'>
									<div className='text-sm text-gray-600'>
										Holders V1: {rowsV1.length}
									</div>
								</div>
							}
						/>
					)}
				</div>
			) : null}
		</div>
	)
}

TokenHolders.defaultProps = {
	avatar: undefined
}
