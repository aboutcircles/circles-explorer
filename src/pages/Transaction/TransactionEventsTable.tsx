import type { ReactElement } from 'react'

import { Table, type Row } from 'components/Table'
import { useRenderCell } from 'shared/EventsTable/useRenderCell'
import type { Event } from 'types/events'

interface TransactionEventsTableProperties {
	events: Event[]
}

const columns = [
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

export function TransactionEventsTable({
	events
}: TransactionEventsTableProperties): ReactElement {
	const renderCell = useRenderCell()

	if (events.length === 0) {
		return (
			<div className='flex min-h-[200px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50'>
				<p className='text-gray-500'>No events found for this transaction</p>
			</div>
		)
	}

	return (
		<div className='rounded-lg border border-gray-200 bg-white shadow-sm'>
			<div className='border-b border-gray-200 px-6 py-4'>
				<h3 className='text-lg font-medium text-gray-900'>
					Transaction Events ({events.length})
				</h3>
			</div>
			<div className='p-6'>
				<Table
					ariaLabel='Transaction events'
					columns={columns}
					rows={events as unknown as Row[]}
					renderCell={renderCell}
					isLoading={false}
				/>
			</div>
		</div>
	)
}
