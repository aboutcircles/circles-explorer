import { Link as RouterLink } from 'react-router-dom'

import { type Column, type Key, type Row, Table } from 'components/Table'
import { isDeadAddress } from 'utils/eth'

const eventDetailsColumns: Column[] = [
	{
		key: 'key',
		label: 'Key'
	},
	{
		key: 'value',
		label: 'Value'
	}
]

const hiddenEventDetails = new Set(['key', 'values'])

const avatarFields = new Set([
	'from',
	'to',
	'canSendTo',
	'user',
	'avatar',
	'truster',
	'trustee',
	'operator'
])

const eventDetailsRenderCell = (item: Row, columnKey: Key) => {
	const cellValue = item[columnKey]

	if (
		avatarFields.has(item.key as string) &&
		columnKey === 'value' &&
		!isDeadAddress(cellValue as string)
	) {
		return (
			<RouterLink className='text-primary' to={`avatar/${cellValue}`}>
				{cellValue}
			</RouterLink>
		)
	}

	return cellValue
}

export function EventDetailsTable({ item }: { item: Row }) {
	return (
		<Table
			renderCell={eventDetailsRenderCell}
			ariaLabel='Event Details'
			columns={eventDetailsColumns}
			rows={Object.entries(item)
				.filter(([key]) => !hiddenEventDetails.has(key))
				.map(([key, value]) => ({
					key,
					value
				}))}
			isLoading={false}
		/>
	)
}
