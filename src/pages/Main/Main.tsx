import type { ReactElement } from 'react'

import { Filter } from './Filter'
import { EventsTable } from './EventsTable'
import { Stats } from './Stats'

export default function Main(): ReactElement {
	return (
		<div className='m-auto flex max-w-[1300px] flex-col'>
			<Stats />

			<Filter />

			<EventsTable />
		</div>
	)
}
