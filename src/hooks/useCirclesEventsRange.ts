import { useBlockNumber } from 'wagmi'

import {
	BLOCK_TIME,
	HOURS_IN_DAY,
	MINUTES_IN_HOUR,
	SECONDS_IN_MINUTE
} from 'constants/time'
import { useFetchCirclesEvents } from 'services/circlesIndex'
import { getDateRange } from 'utils/time'

const BLOCKS_IN_DAY =
	(HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE) / BLOCK_TIME

// 1 page - 1 day
export const useCirclesEventsRange = (page: number) => {
	const dateRange = getDateRange(page)

	const { data: blockNumber } = useBlockNumber({
		watch: false
	})

	const startBlock = blockNumber
		? Number(blockNumber) - page * BLOCKS_IN_DAY
		: 0
	const endBlock = startBlock + BLOCKS_IN_DAY

	const { data: events, isLoading: isEventsLoading } = useFetchCirclesEvents(
		startBlock,
		endBlock
	)

	return {
		events,
		isEventsLoading,
		dateRange
	}
}
