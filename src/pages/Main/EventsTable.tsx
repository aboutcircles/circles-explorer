import type { ReactElement } from 'react'
import { Link, Code, Tooltip } from '@nextui-org/react'
import type { Hex } from 'viem'
import { hexToNumber } from 'viem'
import dayjs from 'dayjs'

import { useFetchCirclesEvents } from 'services/circlesIndex'
import type { Column, Row, Key } from 'components/Table'
import { Table } from 'components/Table'
import { EXPLORER_URL } from 'constants/common'
import { truncateHex } from 'utils/eth'
import { MILLISECONDS_IN_A_SECOND } from 'constants/time'

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
				<Link
					target='_blank'
					isExternal
					href={`${EXPLORER_URL}/tx/${cellValue}`}
				>
					{truncateHex(String(cellValue))}
				</Link>
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
				<Tooltip size='sm' content={date.format()}>
					{dayjs().to(date)}
				</Tooltip>
			)
		}
		default: {
			return cellValue
		}
	}
}

export function EventsTable(): ReactElement {
	const { data: events, isLoading: isEventsLoading } = useFetchCirclesEvents()

	return (
		<div>
			<Table
				ariaLabel='API Keys'
				columns={columns}
				rows={isEventsLoading || !events ? [] : (events as unknown as Row[])}
				renderCell={renderCell}
				isLoading={isEventsLoading}
			/>
		</div>
	)
}
