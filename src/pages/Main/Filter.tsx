import { useCallback } from 'react'
import type React from 'react'
import { isAddress } from 'viem'

import { Search } from 'components/Search'
import { FilterCheckBox } from 'components/FilterCheckBox'
import { EVENTS } from 'constants/events'
import { useFilterStore } from 'stores/useFilterStore'

export function Filter(): React.ReactElement {
	const filterStore = useFilterStore()

	const handleSubmit = useCallback(
		(search: string) => {
			if (!isAddress(search)) return

			filterStore.updateSearch(search)
		},
		[filterStore]
	)

	return (
		<div>
			<div className='m-4 flex justify-center'>
				<Search placeholder='0x...' handleSubmit={handleSubmit} />
			</div>

			<div className='m-4 flex flex-row flex-wrap'>
				{EVENTS.map((event) => (
					<FilterCheckBox
						handleChange={() => filterStore.updateEventTypes(event)}
						isDefaultSelected={filterStore.eventTypes.has(event)}
						className='mr-1'
						key={event}
						label={event}
					/>
				))}
			</div>
		</div>
	)
}
