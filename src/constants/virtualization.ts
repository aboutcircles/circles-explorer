// Numeric constants to avoid magic numbers
const MIN_OVERSCAN_COUNT = 2
const MAX_OVERSCAN_COUNT = 5
const SCROLL_SPEED_THRESHOLD = 100
const DEFAULT_HEIGHT = 600
const LAST_INDEX = -1

/**
 * Constants for virtualization components
 */
export const VIRTUALIZATION = {
	/**
	 * Overscan configuration for virtual lists
	 */
	OVERSCAN: {
		/**
		 * Minimum number of items to render outside the visible area
		 */
		MIN: MIN_OVERSCAN_COUNT,
		/**
		 * Maximum number of items to render outside the visible area during fast scrolling
		 */
		MAX: MAX_OVERSCAN_COUNT,
		/**
		 * Scroll speed threshold in pixels per second to trigger increased overscan
		 */
		THRESHOLD: SCROLL_SPEED_THRESHOLD
	},
	/**
	 * Default height for virtualized containers
	 */
	DEFAULT_CONTAINER_HEIGHT: DEFAULT_HEIGHT,
	/**
	 * Index to access the last element in an array
	 */
	LAST_ELEMENT_INDEX: LAST_INDEX
} as const
