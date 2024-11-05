import { Button } from '@nextui-org/react'
import { useCallback } from 'react'
import { isAddress, isHash } from 'viem'
import { useNavigate } from 'react-router-dom'

import { SearchBox } from 'components/SearchBox'
import { useSearchStore } from 'stores/useSearchStore'

export function Search() {
	const updateSearch = useSearchStore.use.updateSearch()
	const search = useSearchStore.use.search() ?? ''
	const navigate = useNavigate()

	const handleSubmit = useCallback(
		(newSearch: string) => {
			updateSearch(newSearch)
		},
		[updateSearch]
	)

	const handleNavigateToAvatar = useCallback(() => {
		updateSearch('')
		navigate(`/avatar/${search}`)
	}, [updateSearch, navigate, search])

	return (
		<div className='m-4 flex justify-center'>
			<SearchBox
				placeholder='0x...'
				handleSubmit={handleSubmit}
				outerSearch={search}
			/>

			{isAddress(search) && (
				<Button
					onPress={handleNavigateToAvatar}
					isIconOnly
					className='ml-2'
					color='primary'
					isDisabled={!isAddress(search) && !isHash(search)}
				>
					<img
						src='/icons/arrow-right.svg'
						alt='GoToAvatar'
						className='fg-white h-5 w-5'
					/>
				</Button>
			)}
		</div>
	)
}
