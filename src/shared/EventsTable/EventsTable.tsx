import { Button } from '@nextui-org/react'
import type { ReactElement } from 'react'

import type { Column, Row } from 'components/VirtualizedTable'
import { VirtualizedTable } from 'components/VirtualizedTable'
import { useEventsCoordinator } from 'coordinators'
import useBreakpoint from 'hooks/useBreakpoint'

import { TotalLabel } from './TotalLabel'
import { useRenderCell } from './useRenderCell'
import { VirtualizedEventCards } from './VirtualizedEventCards'

// todo:
// write documentation how it works (with some specific details on other things)
// infinite scroll (fetching events)
// fetching profiles
// virtualized table
// virtualized event cards (mobile)
// filters

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

export function EventsTable({ address }: { address?: string }): ReactElement {
	const {
		events,
		isEventsLoading,
		isLoadingMore,
		loadMoreEvents,
		hasMoreEvents
	} = useEventsCoordinator(address ?? null)

	const renderCell = useRenderCell()
	const { isSmScreen } = useBreakpoint()

	const loadMoreButton = (
		<div className='my-4 flex justify-center'>
			<Button
				color='primary'
				isLoading={isLoadingMore}
				isDisabled={isLoadingMore || !hasMoreEvents}
				// eslint-disable-next-line @typescript-eslint/no-misused-promises
				onPressEnd={loadMoreEvents}
			>
				{isLoadingMore ? 'Loading...' : 'Load More'}
			</Button>
		</div>
	)

	return (
		<>
			{isSmScreen ? (
				<div>
					<VirtualizedTable
						ariaLabel='Circles Events'
						columns={columns}
						rows={
							isEventsLoading && events.length === 0
								? []
								: (events as unknown as Row[])
						}
						renderCell={renderCell}
						isLoading={events.length === 0 && isEventsLoading}
						topContent={
							<div className='flex w-full justify-between'>
								<div className='flex flex-row'>
									<TotalLabel eventsLength={events.length} />
								</div>
							</div>
						}
						bottomContent={loadMoreButton}
					/>
				</div>
			) : null}

			{!isSmScreen && (
				<div className='mb-9'>
					<div className='flex flex-col items-center justify-center'>
						<div className='mb-2'>
							<TotalLabel eventsLength={events.length} />
						</div>

						<VirtualizedEventCards
							events={events}
							renderCell={renderCell}
							isLoading={isEventsLoading}
							height={500}
						/>

						<div className='mt-4'>{loadMoreButton}</div>
					</div>
				</div>
			)}
		</>
	)
}

EventsTable.defaultProps = {
	address: ''
}
