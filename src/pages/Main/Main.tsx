import type { ReactElement } from 'react'
import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Address } from 'viem'
import { isAddress } from 'viem'

import { EventsTable } from 'shared/EventsTable'
import { Filter } from 'shared/Filter'
import { useFilterStore } from 'stores/useFilterStore'
import { AvatarSection } from './AvatarSection'
import { Stats } from './Stats'

export default function Main(): ReactElement {
	const [searchParameters] = useSearchParams()
	const search = useFilterStore.use.search()
	const syncWithUrl = useFilterStore.use.syncWithUrl()

	// Sync with URL parameters on mount
	useEffect(() => {
		syncWithUrl({
			search: searchParameters.get('search') ?? '',
			filter: searchParameters.get('filter') ?? null
		})
	}, [searchParameters]) // eslint-disable-line react-hooks/exhaustive-deps

	// it means avatar
	const { isSearchAddress } = useMemo(
		() => ({
			isSearchAddress: isAddress(search as Address)
		}),
		[search]
	)

	return (
		<div className='flex flex-col'>
			{isSearchAddress ? (
				<AvatarSection address={search as Address} />
			) : (
				<Stats />
			)}

			<div className='hidden sm:block'>
				<Filter />
			</div>

			<EventsTable address={isSearchAddress ? search : null} />
		</div>
	)
}
