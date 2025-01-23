import { Button } from '@nextui-org/react'
import { useCallback } from 'react'

import { useFilterStore } from 'stores/useFilterStore'

import { SearchBox } from './SearchBox'

export function Search({
	onOpen,
	isSearchBox,
	onSubmit
}: {
	onOpen: () => void
	isSearchBox?: boolean
	onSubmit?: () => void
}) {
	const updateSearch = useFilterStore.use.updateSearch()
	const search = useFilterStore.use.search() ?? ''

	const handleSubmit = useCallback(
		(newSearch: string) => {
			updateSearch(newSearch)
			onSubmit?.()
		},
		[onSubmit, updateSearch]
	)

	return (
		<>
			<div className='hidden justify-center sm:flex'>
				<SearchBox handleSubmit={handleSubmit} outerSearch={search} />
			</div>

			<div className='sm:hidden'>
				{isSearchBox ? (
					<SearchBox
						className='w-full'
						handleSubmit={handleSubmit}
						outerSearch={search}
					/>
				) : (
					<Button
						onPress={onOpen}
						isIconOnly
						className='ml-2 disabled:cursor-not-allowed'
						color='primary'
						variant='faded'
					>
						<img
							src='/icons/search.svg'
							alt='Submit'
							className='h-5 w-5 invert filter'
						/>
					</Button>
				)}
			</div>
		</>
	)
}

Search.defaultProps = {
	isSearchBox: false,
	onSubmit: () => {}
}
