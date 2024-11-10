import { useCallback } from 'react'

import { SearchBox } from 'components/SearchBox'
import { useSearchStore } from 'stores/useSearchStore'

export function Search() {
	const updateSearch = useSearchStore.use.updateSearch()
	const search = useSearchStore.use.search() ?? ''

	const handleSubmit = useCallback(
		(newSearch: string) => {
			updateSearch(newSearch)
		},
		[updateSearch]
	)

	return (
		<div className='flex justify-center'>
			<SearchBox handleSubmit={handleSubmit} outerSearch={search} />
		</div>
	)
}
