import useBreakpoint from 'hooks/useBreakpoint'
import { useNavigationListener } from 'hooks/useNavigationListener'
import type { ReactElement } from 'react'
import { useMemo } from 'react'
import type { Address } from 'viem'
import { isAddress } from 'viem'

import { EventsTable } from 'shared/EventsTable'
import { Filter } from 'shared/Filter'
import { useFilterStore } from 'stores/useFilterStore'
import { AvatarSection } from './AvatarSection'
import { Stats } from './Stats'

export default function Main(): ReactElement {
	const search = useFilterStore.use.search()

	// Use the navigation listener hook to handle browser back/forward events
	useNavigationListener()

	// it means avatar
	const { isSearchAddress } = useMemo(
		() => ({
			isSearchAddress: isAddress(search as Address)
		}),
		[search]
	)

	const { isSmScreen } = useBreakpoint()

	return (
		<div className='flex flex-col'>
			{isSearchAddress ? (
				<AvatarSection address={search as Address} />
			) : (
				<Stats />
			)}

			{isSmScreen ? (
				<div>
					<Filter className='max-h-[80px]' />
				</div>
			) : null}

			<EventsTable />
		</div>
	)
}
