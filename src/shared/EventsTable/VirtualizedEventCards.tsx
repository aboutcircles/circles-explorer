import { Spinner } from '@nextui-org/react'
import type { ReactElement } from 'react'
import { useRef } from 'react'

import type { Key, Row } from 'components/Table'
import { VIRTUALIZATION } from 'constants/virtualization'
import { useVirtualScroll } from 'hooks/useVirtualScroll'
import type { Event as CirclesEvent } from 'types/events'

type RenderCellReturnType = JSX.Element | number | string

interface VirtualizedEventCardsProperties {
	events: CirclesEvent[]
	renderCell: (row: Row, columnKey: Key) => RenderCellReturnType
	isLoading?: boolean
	height?: number
}

// Estimated height of each card
const CARD_HEIGHT = 211

const estimateSize = () => CARD_HEIGHT

export function VirtualizedEventCards({
	events,
	renderCell,
	isLoading = false,
	height = VIRTUALIZATION.DEFAULT_CONTAINER_HEIGHT
}: VirtualizedEventCardsProperties): ReactElement {
	const containerReference = useRef<HTMLDivElement>(null)

	const { virtualItems, paddingTop, paddingBottom } = useVirtualScroll({
		containerRef: containerReference,
		itemCount: events.length,
		estimateSize
	})

	return (
		<div
			ref={containerReference}
			className='relative w-full overflow-auto'
			style={{ height: `${height}px` }}
			role='region'
			aria-label='Events scrollable content'
		>
			{(() => {
				if (isLoading) {
					return (
						<div className='flex h-full w-full items-center justify-center'>
							<Spinner label='Loading...' aria-hidden='true' />
						</div>
					)
				}

				if (events.length === 0) {
					return (
						<div className='flex h-full w-full items-center justify-center text-center text-gray-500'>
							No events to display.
						</div>
					)
				}

				return (
					<div className='relative w-full'>
						{paddingTop > 0 && (
							<div style={{ height: `${paddingTop}px` }} aria-hidden='true' />
						)}
						{virtualItems.map((virtualRow) => {
							const event = events[virtualRow.index]
							return (
								<div
									key={event.key}
									className='animate-fade-in border-t border-gray-200 bg-white p-4 transition-opacity duration-500 ease-in-out hover:bg-gray-50'
									data-index={virtualRow.index}
								>
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
							)
						})}
						{paddingBottom > 0 && (
							<div
								style={{ height: `${paddingBottom}px` }}
								aria-hidden='true'
							/>
						)}
					</div>
				)
			})()}
		</div>
	)
}

VirtualizedEventCards.defaultProps = {
	height: VIRTUALIZATION.DEFAULT_CONTAINER_HEIGHT,
	isLoading: false
}
