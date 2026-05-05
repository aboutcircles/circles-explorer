import { Button } from '@nextui-org/react'
import { useCallback, useEffect, useRef, type ReactElement } from 'react'

import type { Column, Row } from 'components/VirtualizedTable'
import { VirtualizedTable } from 'components/VirtualizedTable'
import { useEventsCoordinator } from 'coordinators'
import useBreakpoint from 'hooks/useBreakpoint'

import { TotalLabel } from './TotalLabel'
import { useRenderCell } from './useRenderCell'
import { VirtualizedEventCards } from './VirtualizedEventCards'

// todo:
// write documentation how it works (with some specific details on other things)
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

	// Choose columns based on context
	const columns = txHash ? transactionColumns : defaultColumns

	// Auto-load next page when scrolling near the end. The scroll listener in
	// useVirtualScroll fires repeatedly while in range; gate explicitly so we
	// don't queue redundant fetches between renders.
	const handleAutoLoad = useCallback(() => {
		if (!isLoadMoreEnabled || isLoadingMore || !hasMoreEvents) return
		void loadMoreEvents()
	}, [isLoadMoreEnabled, isLoadingMore, hasMoreEvents, loadMoreEvents])

	// IntersectionObserver on a sentinel placed where the Load More button
	// sits. Only fires after the user has actually scrolled — without that
	// gate, a short list (e.g. when the avatar-scoped filter drops most events)
	// keeps the sentinel in the viewport on mount and triggers an infinite
	// fetch loop the user never asked for. rootMargin is 0 so the sentinel
	// must be genuinely on-screen, not just within 200px of it.
	const sentinelRef = useRef<HTMLDivElement>(null)
	const handleAutoLoadRef = useRef(handleAutoLoad)
	const hasUserScrolledRef = useRef(false)
	handleAutoLoadRef.current = handleAutoLoad

	useEffect(() => {
		const markScrolled = () => {
			hasUserScrolledRef.current = true
		}
		window.addEventListener('scroll', markScrolled, { passive: true })
		return () => window.removeEventListener('scroll', markScrolled)
	}, [])

	useEffect(() => {
		const sentinel = sentinelRef.current
		if (!sentinel || !isLoadMoreEnabled) return undefined
		const observer = new IntersectionObserver(
			(entries) => {
				const intersecting = entries[0]?.isIntersecting ?? false
				if (intersecting && hasUserScrolledRef.current) {
					handleAutoLoadRef.current()
				}
			},
			{ rootMargin: '0px' }
		)
		observer.observe(sentinel)
		return () => observer.disconnect()
	}, [isLoadMoreEnabled])

	const loadMoreButton = isLoadMoreEnabled && (
		<div className='my-4 flex flex-col items-center'>
			<div ref={sentinelRef} aria-hidden className='h-px w-full' />
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
										<TotalLabel totalEvents={events.length} />
									</div>
								</div>
							) : undefined
						}
						bottomContent={loadMoreButton || undefined}
						onLoadMore={handleAutoLoad}
					/>
				</div>
			) : null}

			{!isSmScreen && (
				<div className='mb-9'>
					<div className='flex flex-col items-center justify-center'>
						{isTotalLabelVisible ? (
							<div className='mb-2'>
								<TotalLabel totalEvents={events.length} />
							</div>
						) : null}

						<VirtualizedEventCards
							events={events}
							renderCell={renderCell}
							isLoading={isEventsLoading}
							height={500}
							onLoadMore={handleAutoLoad}
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
