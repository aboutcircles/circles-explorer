import type { CirclesEventType } from '@circles-sdk/data'
import {
	Button,
	Code,
	Link,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Snippet,
	Tooltip
} from '@nextui-org/react'
import dayjs from 'dayjs'
import { useCallback } from 'react'
import type { Key, Row } from 'components/Table'
import { EXPLORER_URL } from 'constants/common'
import { MILLISECONDS_IN_A_SECOND } from 'constants/time'
import { useFilterStore } from 'stores/useFilterStore'
import { truncateHex } from 'utils/eth'

import { EventDetailsTable } from './EventDetailsTable'

export const useRenderCell = () => {
	const updateEventTypes = useFilterStore.use.updateEventTypes()

	const onEventClick = useCallback(
		(event: CirclesEventType) => {
			updateEventTypes(event)
		},
		[updateEventTypes]
	)

	return useCallback(
		(item: Row, columnKey: Key) => {
			const cellValue = item[columnKey]

			switch (columnKey) {
				case 'info': {
					return (
						<Popover size='sm'>
							<PopoverTrigger>
								<Button isIconOnly variant='faded'>
									<img
										className='h-[13px] w-[13px]'
										src='/icons/eye.svg'
										alt='Info'
									/>
								</Button>
							</PopoverTrigger>
							<PopoverContent>
								<div>
									<EventDetailsTable item={item} />
								</div>
							</PopoverContent>
						</Popover>
					)
				}
				case 'transactionHash': {
					return (
						<Snippet
							symbol=''
							variant='bordered'
							size='sm'
							codeString={String(cellValue)}
						>
							<Link
								target='_blank'
								isExternal
								href={`${EXPLORER_URL}/tx/${cellValue}`}
							>
								{truncateHex(String(cellValue))}
							</Link>
						</Snippet>
					)
				}
				case 'event': {
					return (
						<Code
							className='border-2 hover:cursor-pointer hover:border-dashed hover:border-primary'
							// eslint-disable-next-line react/jsx-no-bind
							onClick={onEventClick.bind(null, cellValue as CirclesEventType)}
						>
							{cellValue}
						</Code>
					)
				}
				case 'blockNumber': {
					return (
						<Link
							target='_blank'
							isExternal
							href={`${EXPLORER_URL}/block/${cellValue}`}
						>
							{cellValue}
						</Link>
					)
				}
				case 'timestamp': {
					const timestampMs = (cellValue as number) * MILLISECONDS_IN_A_SECOND
					const date = dayjs(timestampMs)

					return (
						<Tooltip size='sm' content={date.format('YYYY-MMM-DD HH:mm:ss')}>
							{dayjs().to(date)}
						</Tooltip>
					)
				}
				default: {
					return cellValue
				}
			}
		},
		[onEventClick]
	)
}
