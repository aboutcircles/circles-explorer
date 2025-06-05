import { useEffect, useRef } from 'react'

const DEFAULT_TOP_THRESHOLD = 50

interface ScrollPreservationOptions {
	/**
	 * Reference to the scrollable container
	 */
	containerRef: React.RefObject<HTMLElement>
	/**
	 * Array of items being displayed
	 */
	items: unknown[]
	/**
	 * Height of each row in pixels
	 */
	rowHeight: number
	/**
	 * Threshold in pixels to consider "at top"
	 */
	topThreshold?: number
}

/**
 * Hook to preserve scroll position when new items are added to the top of a list
 */
export function useScrollPreservation({
	containerRef,
	items,
	rowHeight,
	topThreshold = DEFAULT_TOP_THRESHOLD
}: ScrollPreservationOptions): void {
	const previousItemCount = useRef(items.length)
	const previousScrollTop = useRef(0)
	const isInitialized = useRef(false)

	useEffect(() => {
		const element = containerRef.current
		if (!element) return

		// Store current scroll position
		previousScrollTop.current = element.scrollTop
	})

	useEffect(() => {
		const element = containerRef.current
		if (!element) return

		const currentItemCount = items.length
		const itemCountDiff = currentItemCount - previousItemCount.current

		// Skip adjustment on initial load or when no items
		if (!isInitialized.current) {
			isInitialized.current = true
			previousItemCount.current = currentItemCount
			return
		}

		// Skip adjustment if we have no items yet
		if (currentItemCount === 0 || previousItemCount.current === 0) {
			previousItemCount.current = currentItemCount
			return
		}

		// If new items were added to the top (item count increased)
		if (itemCountDiff > 0) {
			const currentScrollTop = element.scrollTop

			// If user is at the top, let them stay at the top (default behavior)
			if (currentScrollTop <= topThreshold) {
				previousItemCount.current = currentItemCount
				return
			}

			// Calculate how much to adjust scroll position
			const scrollAdjustment = itemCountDiff * rowHeight

			// Preserve scroll position by adjusting for new items
			element.scrollTop = currentScrollTop + scrollAdjustment
		}

		// Update previous count
		previousItemCount.current = currentItemCount
	}, [items.length, rowHeight, containerRef, topThreshold])
}
