import { useState, useEffect } from 'react'
import type { ReactElement } from 'react'
import { Tooltip, Pagination, RadioGroup } from '@nextui-org/react'

import type { Column, Row } from 'components/Table'
import { CustomRadio } from 'components/CustomRadio'
import { Table } from 'components/Table'
import { ONE } from 'constants/common'
import { useCirclesEvents } from 'hooks/useCirclesEvents'
import type { PeriodKey } from 'stores/useFilterStore'
import { periods, useFilterStore } from 'stores/useFilterStore'

import { useRenderCell } from './useRenderCell'

// each page - 1h/12h/1d (filtered by amount of blocks)
const TOTAL_PAGES = 30

const columns: Column[] = [
	{
		key: 'info',
		label: (
			<Tooltip content='See preview with event details'>
				<img
					className='ml-[13px] h-[13px] w-[13px]'
					src='/icons/question.svg'
					alt='Details'
				/>
			</Tooltip>
		)
	},
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
	}
]

export function EventsTable({
	address
}: {
	address: string | null
}): ReactElement {
	const [page, setPage] = useState<number>(ONE)
	const period = useFilterStore.use.period()
	const updatePeriod = useFilterStore.use.updatePeriod()

	const { events, isEventsLoading, dateRange } = useCirclesEvents(page)

	const renderCell = useRenderCell()

	useEffect(() => {
		if (address) {
			updatePeriod('1W')
		} else {
			updatePeriod('12H')
		}
	}, [address, updatePeriod])

	return (
		<div>
			<Table
				ariaLabel='Circles Events'
				columns={columns}
				rows={isEventsLoading ? [] : (events as unknown as Row[])}
				renderCell={renderCell}
				isLoading={isEventsLoading}
				topContent={
					<div className='flex w-full justify-between'>
						<div className='flex items-center justify-between'>
							<span className='text-small text-default-400'>
								Total Events: {events.length === 0 ? '...' : events.length}
								<span className='pl-2 text-xs'>
									({dateRange.start} - {dateRange.end}) ({period})
								</span>
							</span>
						</div>

						<RadioGroup
							classNames={{
								wrapper: 'flex-row'
							}}
							value={period}
							onValueChange={(period_) => updatePeriod(period_ as PeriodKey)}
						>
							{Object.values(periods)
								.filter((period_) =>
									address
										? period_.show.includes('avatar')
										: period_.show.includes('all')
								)
								.map((period_) => (
									<CustomRadio key={period_.label} value={period_.label}>
										{period_.label}
									</CustomRadio>
								))}
						</RadioGroup>

						<Pagination
							isCompact
							showControls
							showShadow
							color='primary'
							page={page}
							total={TOTAL_PAGES}
							onChange={(page_) => setPage(page_)}
						/>
					</div>
				}
				bottomContent={
					<div className='flex w-full justify-center'>
						<Pagination
							isCompact
							showControls
							showShadow
							color='primary'
							page={page}
							total={TOTAL_PAGES}
							onChange={(page_) => setPage(page_)}
						/>
					</div>
				}
			/>
		</div>
	)
}
