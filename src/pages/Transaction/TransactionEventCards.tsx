import { Card, CardBody, CardHeader } from '@nextui-org/react'
import type { ReactElement } from 'react'

import type { Row } from 'components/Table'
import { useRenderCell } from 'shared/EventsTable/useRenderCell'
import type { Event } from 'types/events'

interface TransactionEventCardsProperties {
	events: Event[]
}

export function TransactionEventCards({
	events
}: TransactionEventCardsProperties): ReactElement {
	const renderCell = useRenderCell()

	if (events.length === 0) {
		return (
			<div className='flex min-h-[200px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50'>
				<p className='text-gray-500'>No events found for this transaction</p>
			</div>
		)
	}

	return (
		<div className='space-y-4'>
			<div className='mb-4'>
				<h3 className='text-lg font-medium text-gray-900'>
					Transaction Events ({events.length})
				</h3>
			</div>

			{events.map((event, index) => (
				<Card
					key={event.key || `${event.transactionHash}-${index}`}
					className='w-full'
				>
					<CardHeader className='pb-2'>
						<div className='flex w-full items-center justify-between'>
							<div className='flex items-center space-x-2'>
								{renderCell(event as unknown as Row, 'event')}
							</div>
							<div className='text-sm text-gray-500'>
								{renderCell(event as unknown as Row, 'timestamp')}
							</div>
						</div>
					</CardHeader>
					<CardBody className='pt-0'>
						<div className='space-y-3'>
							<div>
								<div className='mb-1 text-sm font-medium text-gray-700'>
									Details
								</div>
								<div className='text-sm'>
									{renderCell(event as unknown as Row, 'details')}
								</div>
							</div>

							<div className='flex items-center justify-between text-sm'>
								<div>
									<span className='font-medium text-gray-700'>Block: </span>
									{renderCell(event as unknown as Row, 'blockNumber')}
								</div>
								<div>{renderCell(event as unknown as Row, 'info')}</div>
							</div>
						</div>
					</CardBody>
				</Card>
			))}
		</div>
	)
}
