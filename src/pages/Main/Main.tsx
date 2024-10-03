import type { ReactElement } from 'react'

import { Search } from 'shared/Search'
import { EventsTable } from 'shared/EventsTable'
import { Filter } from 'shared/Filter'
import { Stats } from './Stats'

export default function Main(): ReactElement {
	return (
		<div className='flex flex-col'>
			<Search />

			<Stats />

			<Filter />

			<EventsTable />
		</div>
	)
}
