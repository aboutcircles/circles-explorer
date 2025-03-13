import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual'
import { useCallback, useEffect, useRef, useState } from 'react'

import { MILLISECONDS_IN_A_SECOND } from 'constants/time'
import { VIRTUALIZATION } from 'constants/virtualization'

interface VirtualScrollOptions<T extends HTMLElement> {
	/**
	 * Reference to the container element
	 */
	containerRef: React.RefObject<T>
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
 * Hook to handle virtualized scrolling
 */
export function useVirtualScroll<T extends HTMLElement>({
	containerRef,
	itemCount,
	estimateSize,
	overscanConfig
}: VirtualScrollOptions<T>): VirtualScrollResult {
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

	// Dynamic overscan based on scroll speed
	const handleScroll = useCallback(
		(event: Event) => {
			const target = event.target as T
			const currentTime = performance.now()
			const currentPosition = target.scrollTop

			if (lastScrollTime.current.time) {
				const timeDiff = currentTime - lastScrollTime.current.time
				const positionDiff = Math.abs(
					currentPosition - lastScrollTime.current.position
				)
				const scrollSpeed = (positionDiff / timeDiff) * MILLISECONDS_IN_A_SECOND

				setOverscanCount(
					scrollSpeed > speedThreshold ? maxOverscan : minOverscan
				)
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

	// Initialize virtualizer
	const virtualizer = useVirtualizer({
		count: itemCount,
		getScrollElement: () => containerRef.current,
		estimateSize,
		overscan: overscanCount
	})

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
