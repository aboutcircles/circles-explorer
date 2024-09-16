import { Button } from '@nextui-org/react'
import type { ReactElement } from 'react'

import { EventsTable } from './EventsTable'

export default function Main(): ReactElement {
	return (
		<div>
			<div>Main Page</div>

			<Button>Click me</Button>

			<EventsTable />
		</div>
	)
}
