import { Button } from '@nextui-org/react'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAddress } from 'viem'
import type { Address } from 'viem'

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
	const navigate = useNavigate()
	const clearStartBlock = useFilterStore.use.clearStartBlock()

	const handleSubmit = useCallback(
		(newSearch: string) => {
			// If search is an address, navigate to the avatar page with events tab
			if (isAddress(newSearch as Address)) {
				clearStartBlock()
				navigate(`/avatar/${newSearch}/events`)
			} else {
				// Otherwise update the search in the filter store
				updateSearch(newSearch)
			}

			onSubmit?.()
		},
		[clearStartBlock, onSubmit, updateSearch, navigate]
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
