import { Pagination } from '@nextui-org/react'
import type { ReactElement } from 'react'
import { useState } from 'react'

import type { Column, Row } from 'components/VirtualizedTable'
import { VirtualizedTable } from 'components/VirtualizedTable'
import { ONE } from 'constants/common'
import useBreakpoint from 'hooks/useBreakpoint'
import { useCirclesEvents } from 'hooks/useCirclesEvents'
import { useFilterStore } from 'stores/useFilterStore'

import { Periods } from './Periods'
import { TotalLabel } from './TotalLabel'
import { useRenderCell } from './useRenderCell'
import { VirtualizedEventCards } from './VirtualizedEventCards'

// each page - 1h/12h/1d (filtered by amount of blocks)
const TOTAL_PAGES = 30

const columns: Column[] = [
	{
		key: 'transactionHash',
		label: 'Tx Hash'
	},
	{
		key: 'event',
		label: 'Event'
	},
	{
		key: 'details',
		label: 'Details'
	},
	{
		key: 'blockNumber',
		label: 'Block'
	},
	{
		key: 'timestamp',
		label: 'Age'
	},
	{
		key: 'info',
		label: ''
	}
]

export function EventsTable({
	address
}: {
	address: string | null
}): ReactElement {
	const [page, setPage] = useState<number>(ONE)
	const period = useFilterStore.use.period()

	const { events, isEventsLoading, dateRange } = useCirclesEvents(page)

	const renderCell = useRenderCell()

	const pagination = (
		<Pagination
			isCompact
			showControls
			showShadow
			color='primary'
			page={page}
			total={TOTAL_PAGES}
			onChange={(page_) => setPage(page_)}
		/>
	)

	const { isSmScreen } = useBreakpoint()

	return (
		<>
			{isSmScreen ? (
				<div>
					<VirtualizedTable
						ariaLabel='Circles Events'
						columns={columns}
						rows={isEventsLoading ? [] : (events as unknown as Row[])}
						renderCell={renderCell}
						isLoading={isEventsLoading}
						topContent={
							<div className='flex w-full justify-between'>
								<div className='flex flex-row'>
									<Periods address={address} />

									<TotalLabel
										eventsLength={events.length}
										dateRange={dateRange}
										period={period}
									/>
								</div>

								{pagination}
							</div>
						}
					/>
				</div>
			) : null}

			{!isSmScreen && (
				<div className='mb-9'>
					<div className='flex flex-col items-center justify-center'>
						<div className='mb-2'>
							<Periods address={address} />
						</div>

						<div className='mb-2'>
							<TotalLabel
								eventsLength={events.length}
								dateRange={dateRange}
								period={period}
							/>
						</div>

						<VirtualizedEventCards
							events={events}
							renderCell={renderCell}
							isLoading={isEventsLoading}
							height={500}
						/>

						<div className='fixed bottom-2 z-10'>{pagination}</div>
					</div>
				</div>
			)}
		</>
	)
}
