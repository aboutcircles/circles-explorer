import { Button } from '@nextui-org/react'
import dayjs from 'dayjs'
import { useCallback, useMemo } from 'react'

import { BLOCK_TIME, MILLISECONDS_IN_A_SECOND } from 'constants/time'
import { useClearEventsCache } from 'domains/events/repository'
import { useStartBlock } from 'hooks/useStartBlock'
import { useBlockNumber } from 'services/viemClient'
import { useFilterStore } from 'stores/useFilterStore'

interface TotalLabelProperties {
	totalEventsWithSubEvents: number
}

export function TotalLabel({ totalEventsWithSubEvents }: TotalLabelProperties) {
	const { currentStartBlock, defaultStartBlock } = useStartBlock()
	const clearStartBlock = useFilterStore.use.clearStartBlock()
	const blockNumber = useBlockNumber()
	const clearEventsCache = useClearEventsCache()

	// Calculate time ago if we have both blocks
	const timeAgo = useMemo(() => {
		if (!blockNumber) return null

		const blockDiff =
			Date.now() -
			(blockNumber - currentStartBlock) * BLOCK_TIME * MILLISECONDS_IN_A_SECOND
		if (blockDiff <= 0) return null
		return blockDiff
	}, [blockNumber, currentStartBlock])

	const handleReset = useCallback(() => {
		clearStartBlock()
		clearEventsCache()
	}, [clearStartBlock, clearEventsCache])

	return (
		<div className='flex items-center justify-between'>
			<span className='text-small text-default-400'>
				<span className='font-semibold text-black'>
					Total Events:{' '}
					{totalEventsWithSubEvents === 0 ? '...' : totalEventsWithSubEvents}
				</span>
				<span className='ml-2 text-small text-default-400'>
					(From Block: {currentStartBlock}
					{timeAgo ? `, ${dayjs().to(timeAgo)}` : ''})
				</span>

				{currentStartBlock !== defaultStartBlock && (
					<Button
						color='primary'
						size='sm'
						className='scale-75'
						isDisabled={currentStartBlock === defaultStartBlock}
						onPressEnd={handleReset}
					>
						Reset
					</Button>
				)}
			</span>
		</div>
	)
}
