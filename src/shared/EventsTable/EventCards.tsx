import type { Event } from 'types/events'

interface EventCardsProperties {
	events: Event[]
}

export function EventCards({ events }: EventCardsProperties) {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
			{events.map((event) => (
				<div
					className='rounded-lg border border-gray-200 bg-white p-4 shadow-md'
					key={event.key}
				>
					{/* Transaction Hash */}
					<div className='flex items-center justify-between'>
						<div>
							<p className='text-sm text-gray-500'>TX Hash</p>
							<p className='font-medium text-gray-900'>
								{event.transactionHash}
							</p>
						</div>
						<p className='text-sm text-gray-500'>{event.timestamp}</p>
					</div>

					{/* Block Number */}
					<div className='mt-2'>
						<p className='text-sm text-gray-500'>Block</p>
						<p className='font-medium text-gray-900'>{event.blockNumber}</p>
					</div>

					{/* Transaction Type */}
					<div className='mt-2'>
						<p className='inline-block rounded-lg bg-gray-100 px-2 py-1 text-sm font-medium text-gray-700'>
							{event.event}
						</p>
					</div>

					{/* From -> To */}
					{/* <div className='mt-4 flex items-center gap-2'> */}
					{/* 	<p className='text-sm text-gray-500'>{transaction.from}</p> */}
					{/* 	<span className='text-gray-400'>→</span> */}
					{/* 	<p className='text-sm text-gray-500'>{transaction.to}</p> */}
					{/* </div> */}

					{/* Amount */}
					{/* <div className='mt-4'> */}
					{/* 	<p className='text-sm text-gray-500'>Amount</p> */}
					{/* 	<p className='font-medium text-gray-900'>{transaction.amount}</p> */}
					{/* </div> */}
				</div>
			))}
		</div>
	)
}
