import { type Column, type Key, type Row, Table } from 'components/Table'
import { Timestamp } from 'components/Timestamp'
import { AvatarAddressLink } from 'shared/AvatarAddress'
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

const keyValuesRenderCell = (item: Row, columnKey: Key) => {
	const cellValue =
		typeof item[columnKey] === 'bigint'
			? item[columnKey].toString()
			: item[columnKey]

	if (
		avatarFields.has(item.key as string) &&
		columnKey === 'value' &&
		!isDeadAddress(cellValue as string)
	) {
		return <AvatarAddressLink address={cellValue as string} size='sm' />
	}
	if (item.key === 'timestamp' && columnKey === 'value') {
		return <Timestamp value={cellValue as number} />
	}

	return cellValue
}

export function KeyValuesTable({ item }: { item: Row }) {
	return (
		<Table
			renderCell={keyValuesRenderCell}
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
