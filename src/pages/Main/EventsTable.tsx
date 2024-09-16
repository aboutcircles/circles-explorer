import type { ReactElement } from 'react'

import { useFetchCirclesEvents } from 'services/circlesIndex'
import type { Column, Row } from 'components/Table'
import { Table } from 'components/Table'

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
	},
	{
		key: 'actions',
		label: 'Actions',
		align: 'center'
	}
]

export function EventsTable(): ReactElement {
	const { data: events, isLoading: isEventsLoading } = useFetchCirclesEvents()

	return (
		<div>
			<Table
				ariaLabel='API Keys'
				columns={columns}
				rows={isEventsLoading || !events ? [] : (events as unknown as Row[])}
				// renderCell={renderCell}
				isLoading={isEventsLoading}
				// topContent={topContent}
				// selectionMode={selectionMode}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// selectedKeys={selectedKeys}
				// onSelectionChange={onSelectionChange}
			/>
		</div>
	)
}
