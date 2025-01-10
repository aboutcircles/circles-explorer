import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useFilterStore } from 'stores/useFilterStore'

export const useSearchSync = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const search = useFilterStore.use.search()
	const updateSearch = useFilterStore.use.updateSearch()

	// Update store when query changes (e.g., pasting a URL with `search`)
	useEffect(() => {
		if (location.search) {
			const searchParameters = new URLSearchParams(location.search)
			const searchQuery = searchParameters.get('search')

			if (searchQuery) {
				updateSearch(searchQuery)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.search])

	// Update URL when store changes
	useEffect(() => {
		const searchParameters = new URLSearchParams(location.search)

		if (search) {
			searchParameters.set('search', search)
		} else {
			searchParameters.delete('search')
		}

		navigate({
			pathname: location.pathname,
			search: `?${searchParameters.toString()}`
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search])

	return null
}
