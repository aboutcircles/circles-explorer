import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual'
import { useCallback, useEffect, useRef, useState } from 'react'

import { MILLISECONDS_IN_A_SECOND } from 'constants/time'
import { VIRTUALIZATION } from 'constants/virtualization'

const OVERSCAN_UPDATE_DELAY = 50 // milliseconds

interface VirtualScrollOptions {
	/**
	 * Reference to the container element
	 */
	containerRef: React.RefObject<HTMLElement>
	/**
	 * Number of items to virtualize
	 */
	itemCount: number
	/**
	 * Function to estimate the size of each item
	 */
	estimateSize: () => number
	/**
	 * Optional custom overscan configuration
	 */
	overscanConfig?: {
		min?: number
		max?: number
		threshold?: number
	}
	/**
	 * Optional callback for when the user scrolls to the end
	 */
	onReachEnd?: () => void
	/**
	 * Optional threshold in pixels for when to trigger the onReachEnd callback
	 */
	endThreshold?: number
}

interface VirtualScrollResult {
	/**
	 * Virtual items to render
	 */
	virtualItems: VirtualItem[]
	/**
	 * Total size of all items
	 */
	totalSize: number
	/**
	 * Padding to add at the top of the list
	 */
	paddingTop: number
	/**
	 * Padding to add at the bottom of the list
	 */
	paddingBottom: number
	/**
	 * Current overscan count
	 */
	overscanCount: number
}

/**
 * Hook to handle virtualized scrolling with infinite scroll support
 */
export function useVirtualScroll({
	containerRef,
	itemCount,
	estimateSize,
	overscanConfig,
	onReachEnd,
	endThreshold = VIRTUALIZATION.OVERSCAN.THRESHOLD
}: VirtualScrollOptions): VirtualScrollResult {
	// Default overscan values
	const minOverscan = overscanConfig?.min ?? VIRTUALIZATION.OVERSCAN.MIN
	const maxOverscan = overscanConfig?.max ?? VIRTUALIZATION.OVERSCAN.MAX
	const speedThreshold =
		overscanConfig?.threshold ?? VIRTUALIZATION.OVERSCAN.THRESHOLD

	// State for dynamic overscan
	const [overscanCount, setOverscanCount] = useState(minOverscan)
	const lastScrollTime = useRef<{ time: number; position: number }>({
		time: 0,
		position: 0
	})
	const overscanTimeout = useRef<number>()

	// Cleanup timeout on unmount
	useEffect(
		() => () => {
			if (overscanTimeout.current) {
				window.clearTimeout(overscanTimeout.current)
			}
		},
		[]
	)

	// Initialize virtualizer
	const virtualizer = useVirtualizer({
		count: itemCount,
		getScrollElement: () => containerRef.current,
		estimateSize,
		overscan: overscanCount,
		scrollMargin: 0,
		scrollPaddingEnd: endThreshold
	})

	// Dynamic overscan based on scroll speed
	const handleScroll = useCallback(
		(event: Event) => {
			const target = event.target as HTMLElement
			const currentTime = performance.now()
			const currentPosition = target.scrollTop

			if (lastScrollTime.current.time) {
				const timeDiff = currentTime - lastScrollTime.current.time
				const positionDiff = Math.abs(
					currentPosition - lastScrollTime.current.position
				)
				const scrollSpeed = (positionDiff / timeDiff) * MILLISECONDS_IN_A_SECOND

				// Debounce overscan updates
				if (overscanTimeout.current) {
					window.clearTimeout(overscanTimeout.current)
				}

				overscanTimeout.current = window.setTimeout(() => {
					setOverscanCount(
						scrollSpeed > speedThreshold ? maxOverscan : minOverscan
					)
				}, OVERSCAN_UPDATE_DELAY) // Small delay to batch overscan changes
			}

			lastScrollTime.current = { time: currentTime, position: currentPosition }
		},
		[maxOverscan, minOverscan, speedThreshold]
	)

	// Set up scroll event listener
	useEffect(() => {
		const element = containerRef.current
		if (!element) {
			return void 0
		}

		element.addEventListener('scroll', handleScroll)
		return () => element.removeEventListener('scroll', handleScroll)
	}, [containerRef, handleScroll])

	// Latch onReachEnd so it fires once per "scrolled-into-range" episode. The
	// scroll handler runs many times while the user lingers near the bottom;
	// without a latch we'd spam the callback before the next page can land.
	// The latch resets when itemCount grows (next page arrived) or when the
	// user scrolls back out of the threshold window.
	const reachEndLatched = useRef(false)
	useEffect(() => {
		reachEndLatched.current = false
	}, [itemCount])

	useEffect(() => {
		if (!onReachEnd || !containerRef.current) return void 0

		const element = containerRef.current

		const handleInfiniteScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = element
			const inRange =
				scrollHeight - scrollTop - clientHeight < endThreshold &&
				itemCount > 0

			if (!inRange) {
				reachEndLatched.current = false
				return
			}

			if (reachEndLatched.current) return
			reachEndLatched.current = true
			onReachEnd()
		}

		element.addEventListener('scroll', handleInfiniteScroll)

		// Also check on mount / itemCount change. When the rendered content
		// doesn't fill the virtualized container (e.g. only a handful of
		// events match the current filter or block range), the inner scroll
		// never fires and the user can't reach the bottom. Auto-load until
		// the container fills or the consumer reports `hasMoreEvents=false`.
		// rAF defers the check until layout has run so scrollHeight reflects
		// the just-rendered virtual items.
		const rafId = requestAnimationFrame(handleInfiniteScroll)

		return () => {
			cancelAnimationFrame(rafId)
			element.removeEventListener('scroll', handleInfiniteScroll)
		}
	}, [containerRef, itemCount, onReachEnd, endThreshold])

	// Calculate padding values
	const virtualItems = virtualizer.getVirtualItems()
	const totalSize = virtualizer.getTotalSize()
	const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start ?? 0 : 0
	const paddingBottom =
		virtualItems.length > 0
			? totalSize -
				(virtualItems.at(VIRTUALIZATION.LAST_ELEMENT_INDEX)?.end ?? 0)
			: 0

	return {
		virtualItems,
		totalSize,
		paddingTop,
		paddingBottom,
		overscanCount
	}
}
