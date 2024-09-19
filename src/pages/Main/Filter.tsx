import type React from 'react'

import { Search } from 'components/Search'
import { FilterCheckBox } from 'components/FilterCheckBox'
import { EVENTS } from 'constants/events'

export function Filter(): React.ReactElement {
	return (
		<div>
			<div className='m-4 flex justify-center'>
				{/* eslint-disable-next-line react/jsx-handler-names */}
				<Search placeholder='0x...' onChange={() => {}} onSubmit={() => {}} />
			</div>

			<div className='m-4 flex flex-row'>
				{EVENTS.map((event) => (
					<FilterCheckBox className='mr-1' key={event} label={event} />
				))}
			</div>
		</div>
	)
}
