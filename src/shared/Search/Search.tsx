import { Button } from '@nextui-org/react'
import { useCallback } from 'react'

import useBreakpoint from 'hooks/useBreakpoint'
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

	const { isSmScreen } = useBreakpoint()

	return (
		<>
			{isSmScreen ? (
				<div className='flex justify-center'>
					<SearchBox handleSubmit={handleSubmit} outerSearch={search} />
				</div>
			) : null}

			{!isSmScreen && (
				<div>
					{isSearchBox ? (
						<SearchBox
							className='w-full'
							handleSubmit={handleSubmit}
							outerSearch={search}
						/>
					) : (
						<Button
							onPressEnd={onOpen}
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
			)}
		</>
	)
}

Search.defaultProps = {
	isSearchBox: false,
	onSubmit: () => {}
}
