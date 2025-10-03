import { Button } from '@nextui-org/react'
import type { ReactElement } from 'react'
import { useMemo } from 'react'

import type { Column, Row } from 'components/VirtualizedTable'
import { VirtualizedTable } from 'components/VirtualizedTable'
import { useEventsCoordinator } from 'coordinators'
import useBreakpoint from 'hooks/useBreakpoint'
import { useFilterStore } from 'stores/useFilterStore'

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

// Default columns for main page
const defaultColumns: Column[] = [
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

// Transaction page columns (no transactionHash)
const transactionColumns: Column[] = [
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

interface EventsTableProperties {
	address?: string
	txHash?: string
	isLoadMoreEnabled?: boolean
	isTotalLabelVisible?: boolean
}

export function EventsTable({
	address,
	txHash,
	isLoadMoreEnabled = true,
	isTotalLabelVisible = true
}: EventsTableProperties): ReactElement {
	const {
		events,
		isEventsLoading,
		isLoadingMore,
		loadMoreEvents,
		hasMoreEvents
	} = useEventsCoordinator(address ?? null, txHash ?? null)

	const renderCell = useRenderCell()
	const { isSmScreen } = useBreakpoint()
	const eventTypesAmount = useFilterStore.use.eventTypesAmount()

	// Choose columns based on context
	const columns = txHash ? transactionColumns : defaultColumns

	// Calculate total events from eventTypesAmount (more efficient)
	const totalEventsWithSubEvents = useMemo(() => {
		let total = 0
		for (const count of eventTypesAmount.values()) {
			total += count
		}
		return total
	}, [eventTypesAmount])

	const loadMoreButton = isLoadMoreEnabled && (
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
							isTotalLabelVisible ? (
								<div className='flex w-full justify-between'>
									<div className='flex flex-row'>
										<TotalLabel
											totalEventsWithSubEvents={totalEventsWithSubEvents}
										/>
									</div>
								</div>
							) : undefined
						}
						bottomContent={loadMoreButton || undefined}
					/>
				</div>
			) : null}

			{!isSmScreen && (
				<div className='mb-9'>
					<div className='flex flex-col items-center justify-center'>
						{isTotalLabelVisible ? (
							<div className='mb-2'>
								<TotalLabel
									totalEventsWithSubEvents={totalEventsWithSubEvents}
								/>
							</div>
						) : null}

						<VirtualizedEventCards
							events={events}
							renderCell={renderCell}
							isLoading={isEventsLoading}
							height={500}
						/>

						{loadMoreButton ? (
							<div className='mt-4'>{loadMoreButton}</div>
						) : null}
					</div>
				</div>
			)}
		</>
	)
}

EventsTable.defaultProps = {
	address: '',
	isLoadMoreEnabled: true,
	isTotalLabelVisible: true,
	txHash: undefined
}
