import type { Event } from 'types/events'
import type { Key, Row } from 'components/Table'

type RenderCellReturnType = JSX.Element | number | string

interface EventCardsProperties {
	events: Event[]
	renderCell: (row: Row, columnKey: Key) => RenderCellReturnType
}

export function EventCards({ events, renderCell }: EventCardsProperties) {
	return (
		<div className='flex w-full flex-col'>
			{events.map((event) => (
				<div className='border-t border-gray-200 bg-white p-4' key={event.key}>
					{/* Transaction Hash */}
					<div className='flex justify-between'>
						<div>
							<div className='text-sm text-gray-500'>TX Hash</div>
							<div className='font-medium text-gray-900'>
								{renderCell(event as unknown as Row, 'transactionHash')}
							</div>
						</div>
						<div className='text-sm text-gray-500'>
							{renderCell(event as unknown as Row, 'timestamp')}
						</div>
					</div>
					{/* Block Number */}
					<div className='mt-2 flex items-center'>
						<div className='pr-1 text-sm text-gray-500'>Block: </div>
						<div className='font-medium text-gray-900'>
							{renderCell(event as unknown as Row, 'blockNumber')}
						</div>
					</div>
					{/* Event Type */}
					<div className='mt-2'>
						<div>{renderCell(event as unknown as Row, 'event')}</div>
					</div>
					{/* Details */}
					<div className='mt-2'>
						<div>{renderCell(event as unknown as Row, 'details')}</div>
					</div>
				</div>
			))}
		</div>
	)
}
