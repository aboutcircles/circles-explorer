import { useState } from 'react'
import type { ReactElement } from 'react'
import {
	Link,
	Code,
	Tooltip,
	Snippet,
	Pagination,
	RadioGroup
} from '@nextui-org/react'
import type { Hex } from 'viem'
import { hexToNumber } from 'viem'
import dayjs from 'dayjs'

import type { Column, Row, Key } from 'components/Table'
import { CustomRadio } from 'components/CustomRadio'
import { Table } from 'components/Table'
import { EXPLORER_URL, ONE } from 'constants/common'
import { truncateHex } from 'utils/eth'
import { MILLISECONDS_IN_A_SECOND } from 'constants/time'
import { useCirclesEvents } from 'hooks/useCirclesEvents'
import type { PeriodKey } from 'stores/useFilterStore'
import { periods, useFilterStore } from 'stores/useFilterStore'

// each page - 1h/6h/1d (filtered by amount of blocks)
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
		key: 'blockNumber',
		label: 'Block'
	},
	{
		key: 'timestamp',
		label: 'Age'
	}
]

const renderCell = (item: Row, columnKey: Key) => {
	const cellValue = item[columnKey]

	switch (columnKey) {
		case 'transactionHash': {
			return (
				<Snippet
					symbol=''
					variant='bordered'
					size='sm'
					codeString={String(cellValue)}
				>
					<Link
						target='_blank'
						isExternal
						href={`${EXPLORER_URL}/tx/${cellValue}`}
					>
						{truncateHex(String(cellValue))}
					</Link>
				</Snippet>
			)
		}
		case 'event': {
			return <Code>{cellValue}</Code>
		}
		case 'blockNumber': {
			const blockNumber = hexToNumber(cellValue as Hex)

			return (
				<Link
					target='_blank'
					isExternal
					href={`${EXPLORER_URL}/block/${blockNumber}`}
				>
					{blockNumber}
				</Link>
			)
		}
		case 'timestamp': {
			const timestampSecs = hexToNumber(cellValue as Hex)
			const timestampMs = timestampSecs * MILLISECONDS_IN_A_SECOND
			const date = dayjs(timestampMs)

			return (
				<Tooltip size='sm' content={date.format('YYYY-MMM-DD HH:mm:ss')}>
					{dayjs().to(date)}
				</Tooltip>
			)
		}
		default: {
			return cellValue
		}
	}
}

export function EventsTable({ address }: { address?: string }): ReactElement {
	const [page, setPage] = useState<number>(ONE)
	const period = useFilterStore.use.period()
	const updatePeriod = useFilterStore.use.updatePeriod()

	const { events, isEventsLoading, dateRange } = useCirclesEvents(
		page,
		address ?? null
	)

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
							{Object.values(periods).map((period_) => (
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

EventsTable.defaultProps = {
	address: null
}