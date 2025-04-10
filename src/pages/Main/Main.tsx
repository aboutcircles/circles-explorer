import useBreakpoint from 'hooks/useBreakpoint'
import { useNavigationListener } from 'hooks/useNavigationListener'
import type { ReactElement } from 'react'
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Address } from 'viem'
import { isAddress } from 'viem'

import { EventsTable } from 'shared/EventsTable'
import { Filter } from 'shared/Filter'
import { useFilterStore } from 'stores/useFilterStore'
import { Stats } from './Stats'

export default function Main(): ReactElement {
	const search = useFilterStore.use.search()
	const navigate = useNavigate()

	// Use the navigation listener hook to handle browser back/forward events
	useNavigationListener()

	// Detect if search is an address and redirect to avatar page
	const { isSearchAddress } = useMemo(
		() => ({
			isSearchAddress: isAddress(search as Address)
		}),
		[search]
	)

	useEffect(() => {
		if (isSearchAddress) {
			navigate(`/avatar/${search}/events`)
		}
	}, [isSearchAddress, navigate, search])

	const { isSmScreen } = useBreakpoint()

	return (
		<div className='flex flex-col'>
			<Stats />

			{isSmScreen ? (
				<div>
					<Filter />
				</div>
			) : null}

			<EventsTable />
		</div>
	)
}
