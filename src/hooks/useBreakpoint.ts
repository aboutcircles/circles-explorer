import { useEffect, useState } from 'react'

// Tailwind default breakpoints
export const BREAKPOINTS = {
	sm: 640, // eslint-disable-line @typescript-eslint/no-magic-numbers
	md: 768, // eslint-disable-line @typescript-eslint/no-magic-numbers
	lg: 1024, // eslint-disable-line @typescript-eslint/no-magic-numbers
	xl: 1280, // eslint-disable-line @typescript-eslint/no-magic-numbers
	'2xl': 1536 // eslint-disable-line @typescript-eslint/no-magic-numbers
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS

type BreakpointState = {
	[K in BreakpointKey as `is${Capitalize<K>}Screen`]: boolean
}

export const useBreakpoint = (): BreakpointState => {
	const [breakpoints, setBreakpoints] = useState<BreakpointState>({
		isSmScreen: true,
		isMdScreen: false,
		isLgScreen: false,
		isXlScreen: false,
		is2xlScreen: false
	})

	useEffect(() => {
		// Create media query lists for each breakpoint
		const mediaQueries = Object.entries(BREAKPOINTS).map(([key, value]) => {
			const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1) // eslint-disable-line @typescript-eslint/no-magic-numbers
			const query = window.matchMedia(`(min-width: ${value}px)`)

			// Initial state
			setBreakpoints((previous) => ({
				...previous,
				[`is${capitalizedKey}Screen`]: query.matches
			}))

			// Add listener for changes
			const updateMatch = (event: MediaQueryListEvent) => {
				setBreakpoints((previous) => ({
					...previous,
					[`is${capitalizedKey}Screen`]: event.matches
				}))
			}

			query.addEventListener('change', updateMatch)

			// Return cleanup function
			return { query, updateMatch, key: capitalizedKey }
		})

		// Cleanup function
		return () => {
			for (const { query, updateMatch } of mediaQueries) {
				query.removeEventListener('change', updateMatch)
			}
		}
	}, [])

	return breakpoints
}

export default useBreakpoint
