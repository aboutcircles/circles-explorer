import { Button } from '@nextui-org/react'
import type { ReactElement } from 'react'

import type { Column, Row } from 'components/VirtualizedTable'
import { VirtualizedTable } from 'components/VirtualizedTable'
import useBreakpoint from 'hooks/useBreakpoint'
import { useCirclesEvents } from 'hooks/useCirclesEvents'

import { TotalLabel } from './TotalLabel'
import { useRenderCell } from './useRenderCell'
import { VirtualizedEventCards } from './VirtualizedEventCards'

// todo:
// - when search change - nullable previousEventsLength
// - when load more - load not full range, but diff
// - clear startBlock and default range on go back or go to search, etc.
// - when loading more do not hide events, just show scroll in button (then maybe we don't need extra isLoading flag)
// - do not put startBlock in url if user did not load more yet
// - add clear startBlock button
// - more refactor for useCirclesEvents.ts

// - check if double watch happening
// - past link recheck

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

export function EventsTable(): ReactElement {
	const {
		events,
		isEventsLoading,
		isLoadingMore,
		loadMoreEvents,
		isBlockedLoadingMore
	} = useCirclesEvents()

	const renderCell = useRenderCell()
	const { isSmScreen } = useBreakpoint()

	const loadMoreButton = (
		<div className='my-4 flex justify-center'>
			<Button
				color='primary'
				isLoading={isLoadingMore}
				isDisabled={isLoadingMore || isBlockedLoadingMore}
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
						rows={isEventsLoading ? [] : (events as unknown as Row[])}
						renderCell={renderCell}
						isLoading={isEventsLoading}
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
