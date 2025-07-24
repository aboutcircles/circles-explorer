import { Chip, Link, Snippet } from '@nextui-org/react'
import type { ReactElement } from 'react'
import { formatUnits } from 'viem'

import { Timestamp } from 'components/Timestamp'
import {
	CRC_TOKEN_DECIMALS,
	CRC_TOKEN_SYMBOL,
	EXPLORER_URL
} from 'constants/common'
import { AvatarAddress } from 'shared/AvatarAddress'
import type { TransactionMetadata } from 'types/transaction'
import { truncateHex } from 'utils/eth'

const DECIMAL_PLACES = 4

interface TransactionHeaderProperties {
	metadata: TransactionMetadata
}

export function TransactionHeader({
	metadata
}: TransactionHeaderProperties): ReactElement {
	const {
		hash,
		status,
		blockNumber,
		timestamp,
		from,
		to,
		value,
		transactionIndex
	} = metadata

	return (
		<div className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
			<div className='mb-6 flex items-center justify-between'>
				<h1 className='text-2xl font-bold text-gray-900'>
					Transaction Details
				</h1>
				<Chip
					color={status === 'success' ? 'success' : 'danger'}
					variant='flat'
					size='sm'
				>
					{status === 'success' ? 'Success' : 'Failed'}
				</Chip>
			</div>

			<div className='grid gap-6 md:grid-cols-2'>
				{/* Left Column */}
				<div className='space-y-4'>
					<div>
						<div className='block text-sm font-medium text-gray-700'>
							Transaction Hash
						</div>
						<div className='mt-1 flex items-center space-x-2'>
							<code className='text-sm text-gray-900'>{truncateHex(hash)}</code>
							<Snippet
								symbol=''
								variant='flat'
								className='min-w-0 bg-transparent p-0'
								size='sm'
								codeString={hash}
							/>
						</div>
					</div>

					<div>
						<div className='block text-sm font-medium text-gray-700'>
							Block Number
						</div>
						<div className='mt-1'>
							<Link
								href={`${EXPLORER_URL}/block/${blockNumber}`}
								isExternal
								className='text-sm'
							>
								{blockNumber.toLocaleString()}
							</Link>
						</div>
					</div>

					<div>
						<div className='block text-sm font-medium text-gray-700'>
							Timestamp
						</div>
						<div className='mt-1 text-sm text-gray-900'>
							<Timestamp value={timestamp} />
						</div>
					</div>

					<div>
						<div className='block text-sm font-medium text-gray-700'>
							Position in Block
						</div>
						<div className='mt-1 text-sm text-gray-900'>{transactionIndex}</div>
					</div>
				</div>

				{/* Right Column */}
				<div className='space-y-4'>
					{from ? (
						<div>
							<div className='block text-sm font-medium text-gray-700'>
								From
							</div>
							<div className='mt-1'>
								<AvatarAddress address={from} />
							</div>
						</div>
					) : null}

					{to ? (
						<div>
							<div className='block text-sm font-medium text-gray-700'>To</div>
							<div className='mt-1'>
								<AvatarAddress address={to} />
							</div>
						</div>
					) : null}

					{value && value !== '0' ? (
						<div>
							<div className='block text-sm font-medium text-gray-700'>
								Value
							</div>
							<div className='mt-1 text-sm text-gray-900'>
								{Number(formatUnits(BigInt(value), CRC_TOKEN_DECIMALS)).toFixed(
									DECIMAL_PLACES
								)}{' '}
								{CRC_TOKEN_SYMBOL}
							</div>
						</div>
					) : null}
				</div>
			</div>
		</div>
	)
}
