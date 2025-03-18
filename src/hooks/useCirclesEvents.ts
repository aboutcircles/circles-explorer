import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { avatarFields } from 'constants/avatarFields'
import {
	DEFAULT_BLOCK_RANGE,
	MAX_BLOCK_RANGE,
	RANGE_MULTIPLIER
} from 'constants/blockRange'
import { useBlockNumber } from 'hooks/useBlockNumber'
import { useProfiles } from 'hooks/useProfiles'
import { useFetchCirclesEvents } from 'services/circlesIndex'
import logger from 'services/logger'
import { useFilterStore } from 'stores/useFilterStore'
import type { Event } from 'types/events'

// Constants for retry logic
const MAX_RETRY_COUNT = 3
const RETRY_INCREMENT = 1

export const useCirclesEvents = () => {
	const eventTypes = useFilterStore.use.eventTypes()
	const search = useFilterStore.use.search()
	const updateEventTypesAmount = useFilterStore.use.updateEventTypesAmount()
	const startBlock = useFilterStore.use.startBlock()
	const updateStartBlock = useFilterStore.use.updateStartBlock()

	const blockNumber = useBlockNumber()
	const isInitialized = useRef(false)

	// State for block range management
	const [currentRange, setCurrentRange] = useState(DEFAULT_BLOCK_RANGE)
	const [hasFoundEvents, setHasFoundEvents] = useState(false)
	const [hasMoreEvents, setHasMoreEvents] = useState(true)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [isRecursivelyFetching, setIsRecursivelyFetching] = useState(false)
	const [retryCount, setRetryCount] = useState(0)

	// Initialize block range when block number is available
	useEffect(() => {
		if (blockNumber && !isInitialized.current && startBlock === 0) {
			// Start from the latest block and go back by DEFAULT_BLOCK_RANGE
			const newStartBlock = Math.max(0, blockNumber - DEFAULT_BLOCK_RANGE)
			updateStartBlock(newStartBlock)
			isInitialized.current = true
		}
	}, [blockNumber, startBlock, updateStartBlock])

	const {
		data: { events, eventTypesAmount } = {},
		isLoading: isEventsLoading,
		refetch
	} = useFetchCirclesEvents(
		startBlock,
		null,
		Boolean(blockNumber) && startBlock > 0,
		!search,
		search
	)

	// Recursive fetching with doubling range until we find events
	const loadMoreEvents = useCallback(() => {
		console.log({ hasMoreEvents, isLoadingMore, isRecursivelyFetching })

		if (!hasMoreEvents || isLoadingMore || isRecursivelyFetching) return

		setIsLoadingMore(true)
		setIsRecursivelyFetching(true)

		console.log({ hasFoundEvents })

		// If we've already found events, just load more by going back by currentRange
		if (hasFoundEvents) {
			const newStartBlock = Math.max(0, startBlock - currentRange)

			// If we've reached block 0, there are no more events to load
			if (newStartBlock === 0) {
				setHasMoreEvents(false)
				setIsLoadingMore(false)
				setIsRecursivelyFetching(false)
				return
			}

			logger.log(
				'[hooks][useCirclesEvents] Loading more events from block',
				newStartBlock
			)
			updateStartBlock(newStartBlock)
			setIsLoadingMore(false)
			setIsRecursivelyFetching(false)
			return
		}

		// If we haven't found events yet, double the range and try again
		// But don't exceed MAX_BLOCK_RANGE
		const newRange = Math.min(currentRange * RANGE_MULTIPLIER, MAX_BLOCK_RANGE)
		const newStartBlock = Math.max(0, blockNumber ? blockNumber - newRange : 0)

		console.log({ newStartBlock })

		// If we've reached MAX_BLOCK_RANGE or block 0 and still no events, stop trying
		if (newRange === MAX_BLOCK_RANGE || newStartBlock === 0) {
			if (retryCount >= MAX_RETRY_COUNT) {
				setHasMoreEvents(false)
				setIsLoadingMore(false)
				setIsRecursivelyFetching(false)
				logger.warn(
					'[hooks][useCirclesEvents] Reached maximum range or block 0, giving up'
				)
				return
			}
			setRetryCount(retryCount + RETRY_INCREMENT)
		}

		logger.log(
			'[hooks][useCirclesEvents] No events found, doubling range and trying again...',
			{ newRange, newStartBlock }
		)

		setCurrentRange(newRange)
		updateStartBlock(newStartBlock)

		setIsLoadingMore(false)
		setIsRecursivelyFetching(false)

		// Refetch with new range
		void refetch()
	}, [
		hasMoreEvents,
		isLoadingMore,
		isRecursivelyFetching,
		hasFoundEvents,
		currentRange,
		startBlock,
		blockNumber,
		retryCount,
		updateStartBlock,
		refetch
	])

	// Effect to check if we found events and update state accordingly
	useEffect(() => {
		if (events && events.length > 0 && !hasFoundEvents) {
			logger.log('[hooks][useCirclesEvents] Found events, saving range')
			setHasFoundEvents(true)
			setCurrentRange(currentRange)
			setIsRecursivelyFetching(false)
		} else if (events?.length === 0) {
			loadMoreEvents()
		}
	}, [loadMoreEvents, events, hasFoundEvents, currentRange])

	useEffect(() => {
		if (eventTypesAmount) {
			updateEventTypesAmount(eventTypesAmount)
		}
	}, [updateEventTypesAmount, eventTypesAmount])

	const filteredEvents = useMemo(() => {
		if (!events) return []

		return events.filter((event: Event): boolean => eventTypes.has(event.event))
	}, [events, eventTypes])

	// Prefetch profiles for all addresses in the events
	const { fetchProfiles } = useProfiles()

	useEffect(() => {
		if (filteredEvents.length === 0) return

		// Extract all addresses from events using a Set to deduplicate
		const addresses = new Set<string>()
		for (const event of filteredEvents) {
			// Check if the event has the avatar field
			for (const field of avatarFields) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				if (field in event && event[field]) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					addresses.add(String(event[field]).toLowerCase())
				}
			}
		}

		if (addresses.size > 0) {
			void fetchProfiles([...addresses])
		}
	}, [filteredEvents, fetchProfiles])

	return {
		events: filteredEvents,
		isEventsLoading: isEventsLoading || isRecursivelyFetching,
		isLoadingMore,
		loadMoreEvents,
		isRecursivelyFetching
	}
}
