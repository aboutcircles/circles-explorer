import type { CirclesEventType } from '@circles-sdk/data'
import { Code, Link, Snippet, Tooltip } from '@nextui-org/react'
import dayjs from 'dayjs'
import { useCallback } from 'react'
import { formatUnits } from 'viem'

import type { Key, Row } from 'components/Table'
import {
	EXPLORER_URL,
	CRC_TOKEN_DECIMALS,
	CRC_TOKEN_SYMBOL
} from 'constants/common'
import { MILLISECONDS_IN_A_SECOND } from 'constants/time'
import { useFilterStore } from 'stores/useFilterStore'
import { truncateHex } from 'utils/eth'
import { EyePopoverDetails } from 'shared/EyePopoverDetails'
import { LABELS_MAPPER } from 'constants/events'
import { useSearchStore } from 'stores/useSearchStore'

export const useRenderCell = () => {
	const updateEventTypes = useFilterStore.use.updateEventTypes()
	const updateSearch = useSearchStore.use.updateSearch()

	const applyAvatarSearch = useCallback(
		(address: string) => {
			updateSearch(address)
		},
		[updateSearch]
	)

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
					return <EyePopoverDetails item={item} />
				}
				case 'transactionHash': {
					return (
						<Snippet
							symbol=''
							variant='flat'
							className='bg-transparent pl-0'
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
							className='border-2 border-gray-100 bg-gray-50 hover:cursor-pointer hover:border-dashed hover:border-primary'
							// eslint-disable-next-line react/jsx-no-bind
							onClick={onEventClick.bind(null, cellValue as CirclesEventType)}
						>
							{String(cellValue).includes('CrcV1') ? 'V1' : 'V2'} -{' '}
							{LABELS_MAPPER[cellValue as CirclesEventType]}
						</Code>
					)
				}
				case 'details': {
					if ((item.truster && item.trustee) || (item.canSendTo && item.user)) {
						return (
							<div className='flex items-center justify-start'>
								<Code
									className='mr-0 cursor-pointer border-1 border-gray-100 bg-gray-50 md:mr-2'
									// eslint-disable-next-line react/jsx-no-bind
									onClick={applyAvatarSearch.bind(
										null,
										String(item.truster || item.canSendTo)
									)}
								>
									{truncateHex(String(item.truster || item.canSendTo))}
								</Code>
								{' -> '}
								<Code
									className='ml-0 cursor-pointer border-1 border-gray-100 bg-gray-50 md:ml-2'
									// eslint-disable-next-line react/jsx-no-bind
									onClick={applyAvatarSearch.bind(
										null,
										String(item.trustee || item.user)
									)}
								>
									{truncateHex(String(item.trustee || item.user))}
								</Code>
							</div>
						)
					}

					if (
						item.from &&
						item.to &&
						(item.tokenAddress || item.id) &&
						(item.amount || item.value)
					) {
						return (
							<div className='flex flex-row items-center justify-start'>
								<div>
									<Code
										className='cursor-pointer border-1 border-gray-100 bg-gray-50'
										// eslint-disable-next-line react/jsx-no-bind
										onClick={applyAvatarSearch.bind(null, String(item.from))}
									>
										{truncateHex(String(item.from))}
									</Code>
									{' -> '}
									<Code
										className='mr-2 cursor-pointer border-1 border-gray-100 bg-gray-50'
										// eslint-disable-next-line react/jsx-no-bind
										onClick={applyAvatarSearch.bind(null, String(item.to))}
									>
										{truncateHex(String(item.to))}
									</Code>
								</div>

								<div>
									{Number(
										formatUnits(
											BigInt(item.amount || item.value),
											CRC_TOKEN_DECIMALS
										)
										// eslint-disable-next-line @typescript-eslint/no-magic-numbers
									).toFixed(4)}{' '}
									{CRC_TOKEN_SYMBOL}
								</div>
							</div>
						)
					}

					if ((item.event as string).toLowerCase().includes('mint')) {
						return (
							<div>
								{Number(
									formatUnits(BigInt(item.amount), CRC_TOKEN_DECIMALS)
									// eslint-disable-next-line @typescript-eslint/no-magic-numbers
								).toFixed(4)}{' '}
								{CRC_TOKEN_SYMBOL}
							</div>
						)
					}

					return ''
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
		[applyAvatarSearch, onEventClick]
	)
}
