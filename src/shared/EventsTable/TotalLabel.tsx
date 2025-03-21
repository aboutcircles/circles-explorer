import { useMemo } from 'react'
import dayjs from 'dayjs'

import { useBlockNumber } from 'hooks/useBlockNumber'
import { useFilterStore } from 'stores/useFilterStore'
import { MILLISECONDS_IN_A_SECOND, BLOCK_TIME } from 'constants/time'

interface TotalLabelProperties {
	eventsLength: number
}

export function TotalLabel({ eventsLength }: TotalLabelProperties) {
	const startBlock = useFilterStore.use.startBlock()
	const blockNumber = useBlockNumber()

	// Calculate time ago if we have both blocks
	const timeAgo = useMemo(() => {
		if (!blockNumber || !startBlock) return null
		const blockDiff =
			Date.now() -
			(blockNumber - startBlock) * BLOCK_TIME * MILLISECONDS_IN_A_SECOND
		if (blockDiff <= 0) return null
		return blockDiff
	}, [blockNumber, startBlock])

	return (
		<div className='flex items-center justify-between'>
			<span className='text-small text-default-400'>
				<span className='font-semibold text-black'>
					Total Events: {eventsLength === 0 ? '...' : eventsLength}
				</span>
				{startBlock > 0 && (
					<span className='ml-2 text-small text-default-400'>
						(From Block: {startBlock}
						{timeAgo ? `, ${dayjs().to(timeAgo)}` : ''})
					</span>
				)}
			</span>
		</div>
	)
}
