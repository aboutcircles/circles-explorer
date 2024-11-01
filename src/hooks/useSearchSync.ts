import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useSearchStore } from 'stores/useSearchStore'

export const useSearchSync = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const search = useSearchStore.use.search()
	const updateSearch = useSearchStore.use.updateSearch()

	// Update the pathname when the store's query changes
	useEffect(
		() =>
			useSearchStore.subscribe(
				(state) => state.search,
				(newSearch) => {
					const searchParameters = new URLSearchParams(location.search)

					if (newSearch) {
						searchParameters.set('search', newSearch)
					} else {
						searchParameters.delete('search')
					}

					navigate({
						pathname: location.pathname,
						search: `?${searchParameters.toString()}`
					})
				}
			),
		[location.pathname, location.search, navigate]
	)

	// Update the store when pathname search query changes
	useEffect(() => {
		const searchParameters = new URLSearchParams(location.search)
		const searchQuery = searchParameters.get('search')

		if (searchQuery && searchQuery !== search) {
			updateSearch(searchQuery)
		}
	}, [location.search, search, updateSearch])

	return null
}
