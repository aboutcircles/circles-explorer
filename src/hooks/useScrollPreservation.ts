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
	const isInitialized = useRef(false)

	useEffect(() => {
		const element = containerRef.current
		if (!element) return

		const currentItemCount = items.length
		const itemCountDiff = currentItemCount - previousItemCount.current

		// Skip adjustment on initial load
		if (!isInitialized.current) {
			isInitialized.current = true
			previousItemCount.current = currentItemCount
			return
		}

		// Only adjust if new items were added and not at top
		if (itemCountDiff > 0) {
			const currentScrollTop = element.scrollTop
			if (currentScrollTop > topThreshold) {
				// Schedule scroll adjustment for next paint
				queueMicrotask(() => {
					const scrollAdjustment = itemCountDiff * rowHeight
					element.scrollTop = currentScrollTop + scrollAdjustment
				})
			}
		}

		// Update count after adjustment
		previousItemCount.current = currentItemCount
	}, [items.length, rowHeight, containerRef, topThreshold])
}
