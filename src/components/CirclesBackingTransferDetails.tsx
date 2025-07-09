import { Spinner } from '@nextui-org/react'
import type { ReactElement } from 'react'

import { useCirclesBackingTransfers } from 'hooks/useCirclesBackingTransfers'
import { AvatarAddress } from 'shared/AvatarAddress'

interface CirclesBackingTransferDetailsProperties {
	transactionHash: string
}

export function CirclesBackingTransferDetails({
	transactionHash
}: CirclesBackingTransferDetailsProperties): ReactElement | null {
	const {
		data: transfers,
		isLoading,
		error
	} = useCirclesBackingTransfers(transactionHash)

	if (isLoading) {
		return (
			<div className='flex items-center justify-center py-4'>
				<Spinner size='sm' label='Loading transfers...' />
			</div>
		)
	}

	if ((error ?? !transfers) || transfers.length === 0) {
		return null // Don't show anything if no supported token transfers found
	}

	return (
		<div className='mt-2'>
			<div className='space-y-1'>
				{transfers.map((transfer) => (
					<div
						key={`${transfer.tokenAddress}-${transfer.from}-${transfer.to}-${transfer.amount.toString()}`}
						className='flex items-center space-x-2 text-sm'
					>
						<AvatarAddress
							address={transfer.from}
							size='sm'
							className='text-xs'
						/>
						<span className='font-medium text-gray-900'>
							{transfer.formattedAmount}
						</span>
						<div
							className='flex items-center space-x-1'
							title={`${transfer.tokenName} (${transfer.tokenAddress})`}
						>
							<img
								src={transfer.tokenIcon}
								alt={transfer.tokenSymbol}
								className='h-4 w-4 rounded-full'
								onError={(event) => {
									// Fallback to a generic token icon if the specific one fails
									const target = event.target as HTMLImageElement
									target.src = '/icons/tokens/generic.svg'
								}}
							/>
							<span className='text-xs text-gray-600'>
								{transfer.tokenSymbol}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
