import { useMemo } from 'react'
import type { ReactElement } from 'react'
import { useLocation } from 'react-router-dom'
import { isAddress } from 'viem'

import { EventsTable } from 'shared/EventsTable'
import { Filter } from 'shared/Filter'
import { useSearchSync } from 'hooks/useSearchSync'
import { Stats } from './Stats'
import { AvatarSection } from './AvatarSection'

export default function Main(): ReactElement {
	useSearchSync()

	const location = useLocation()

	// it means avatar
	const { isSearchAddress, search } = useMemo(() => {
		const searchParameters = new URLSearchParams(location.search)

		const searchParameter = searchParameters.get('search') ?? ''

		return {
			isSearchAddress: isAddress(searchParameter),
			search: searchParameter
		}
	}, [location.search])

	return (
		<div className='flex flex-col'>
			{isSearchAddress ? <AvatarSection address={search} /> : <Stats />}

			<Filter />

			<EventsTable address={isSearchAddress ? search : null} />
		</div>
	)
}
