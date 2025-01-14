import type { CirclesEventType } from '@circles-sdk/data'
import { Code, Link, Snippet } from '@nextui-org/react'
import { useCallback } from 'react'
import { formatUnits } from 'viem'

import type { Key, Row } from 'components/VirtualizedTable'
import { Timestamp } from 'components/Timestamp'
import {
	CRC_TOKEN_DECIMALS,
	CRC_TOKEN_SYMBOL,
	EXPLORER_URL
} from 'constants/common'
import { LABELS_MAPPER } from 'constants/events'
import { EyePopoverDetails } from 'shared/EyePopoverDetails'
import { useFilterStore } from 'stores/useFilterStore'
import { truncateHex } from 'utils/eth'

export const useRenderCell = () => {
	const updateEventTypes = useFilterStore.use.updateEventTypes()
	const updateSearch = useFilterStore.use.updateSearch()

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
						<div className='flex w-[152px] items-center space-x-2'>
							<Link
								target='_blank'
								isExternal
								href={`${EXPLORER_URL}/tx/${cellValue}`}
								className='font-mono text-sm'
							>
								{truncateHex(String(cellValue))}
							</Link>
							<Snippet
								symbol=''
								variant='flat'
								className='min-w-0 bg-transparent p-0'
								size='sm'
								codeString={String(cellValue)}
							/>
						</div>
					)
				}
				case 'event': {
					return (
						<Code
							className='rounded-md border border-gray-100 bg-gray-50/50 px-2.5 py-1 text-sm hover:cursor-pointer hover:border-dashed hover:border-primary'
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
									className='mr-0 cursor-pointer rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-sm md:mr-2'
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
									className='ml-0 cursor-pointer rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-sm md:ml-2'
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
							<div className='flex flex-row items-center justify-start md:w-[400px]'>
								<div>
									<Code
										className='cursor-pointer rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-sm'
										// eslint-disable-next-line react/jsx-no-bind
										onClick={applyAvatarSearch.bind(null, String(item.from))}
									>
										{truncateHex(String(item.from))}
									</Code>
									{' -> '}
									<Code
										className='mr-2 cursor-pointer rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-sm'
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
					return (
						<div className='w-[160px]'>
							<Timestamp value={cellValue as number} />
						</div>
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
