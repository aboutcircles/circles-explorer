import { useCallback } from 'react'
import { isAddress } from 'viem'
import { useNavigate } from 'react-router-dom'

import { SearchBox } from 'components/SearchBox'
import { useFilterStore } from 'stores/useFilterStore'

export function Search() {
	const updateSearch = useFilterStore.use.updateSearch()
	const navigate = useNavigate()

	const handleSubmit = useCallback(
		(search: string) => {
			if (!isAddress(search)) return

			updateSearch(search)
			navigate(`/avatar/${search}`)
		},
		[updateSearch, navigate]
	)

	return (
		<div className='m-4 flex justify-center'>
			<SearchBox placeholder='0x...' handleSubmit={handleSubmit} />
		</div>
	)
}
