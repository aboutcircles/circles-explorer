import { useState, useCallback } from 'react'
import type { ReactElement } from 'react'
import {
	Link,
	Code,
	Tooltip,
	Snippet,
	Pagination,
	RadioGroup,
	Button,
	Popover,
	PopoverTrigger,
	PopoverContent
} from '@nextui-org/react'
import dayjs from 'dayjs'
import type { CirclesEventType } from '@circles-sdk/data'

import type { Column, Row, Key } from 'components/Table'
import { CustomRadio } from 'components/CustomRadio'
import { Table } from 'components/Table'
import { EXPLORER_URL, ONE } from 'constants/common'
import { truncateHex } from 'utils/eth'
import { MILLISECONDS_IN_A_SECOND } from 'constants/time'
import { useCirclesEvents } from 'hooks/useCirclesEvents'
import type { PeriodKey } from 'stores/useFilterStore'
import { periods, useFilterStore } from 'stores/useFilterStore'

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
		key: 'blockNumber',
		label: 'Block'
	},
	{
		key: 'timestamp',
		label: 'Age'
	}
]

const eventDetailsColumns: Column[] = [
	{
		key: 'key',
		label: 'Key'
	},
	{
		key: 'value',
		label: 'Value'
	}
]

const hiddenEventDetails = new Set(['key', 'values'])

const useRenderCell = () => {
	const updateEventTypes = useFilterStore.use.updateEventTypes()

	const onEventClick = useCallback(
		(event: CirclesEventType) => {
			updateEventTypes(event)
		},
		[updateEventTypes]
	)

	return useCallback(
		(item: Row, columnKey: Key) => {
			const cellValue = item[columnKey]

			switch (columnKey) {
				case 'info': {
					return (
						<Popover size='sm'>
							<PopoverTrigger>
								<Button isIconOnly variant='faded'>
									<img
										className='h-[13px] w-[13px]'
										src='/icons/eye.svg'
										alt='Info'
									/>
								</Button>
							</PopoverTrigger>
							<PopoverContent>
								<div>
									<Table
										ariaLabel='Event Details'
										columns={eventDetailsColumns}
										rows={Object.entries(item)
											.filter(([key]) => !hiddenEventDetails.has(key))
											.map(([key, value]) => ({
												key,
												value
											}))}
										isLoading={false}
									/>
								</div>
							</PopoverContent>
						</Popover>
					)
				}
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
					return (
						<Code
							className='border-2 hover:cursor-pointer hover:border-dashed hover:border-primary'
							// eslint-disable-next-line react/jsx-no-bind
							onClick={onEventClick.bind(null, cellValue as CirclesEventType)}
						>
							{cellValue}
						</Code>
					)
				}
				case 'blockNumber': {
					return (
						<Link
							target='_blank'
							isExternal
							href={`${EXPLORER_URL}/block/${cellValue}`}
						>
							{cellValue}
						</Link>
					)
				}
				case 'timestamp': {
					const timestampMs = (cellValue as number) * MILLISECONDS_IN_A_SECOND
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
		},
		[onEventClick]
	)
}

export function EventsTable({ address }: { address?: string }): ReactElement {
	const [page, setPage] = useState<number>(ONE)
	const period = useFilterStore.use.period()
	const updatePeriod = useFilterStore.use.updatePeriod()

	const { events, isEventsLoading, dateRange } = useCirclesEvents(
		page,
		address ?? null
	)

	const renderCell = useRenderCell()

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
