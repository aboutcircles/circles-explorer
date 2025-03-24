import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFilterStore } from 'stores/useFilterStore'

/**
 * Custom hook to listen for browser navigation events (back/forward)
 * and sync the URL parameters with the filter store
 */
export const useNavigationListener = () => {
	const [searchParameters] = useSearchParams()
	const syncWithUrl = useFilterStore.use.syncWithUrl()

	useEffect(() => {
		const handleNavigation = () => {
			const url = new URL(window.location.href)
			syncWithUrl({
				search: url.searchParams.get('search') ?? '',
				filter: url.searchParams.get('filter') ?? null,
				startBlock: url.searchParams.get('startBlock') ?? null
			})
		}

		// Listen for popstate events which are triggered on browser back/forward navigation
		window.addEventListener('popstate', handleNavigation)

		// Clean up the event listener on component unmount
		return () => window.removeEventListener('popstate', handleNavigation)
	}, [syncWithUrl])

	// Sync with URL parameters on mount
	useEffect(() => {
		syncWithUrl({
			search: searchParameters.get('search') ?? '',
			filter: searchParameters.get('filter') ?? null,
			startBlock: searchParameters.get('startBlock') ?? null
		})
	}, [searchParameters]) // eslint-disable-line react-hooks/exhaustive-deps
}
