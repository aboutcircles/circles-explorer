import type { ReactElement } from 'react'

import { Filter } from './Filter'
import { EventsTable } from './EventsTable'

export default function Main(): ReactElement {
	return (
		<div>
			<Filter />

			<EventsTable />
		</div>
	)
}
