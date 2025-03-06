import type { CirclesEventType } from '@circles-sdk/data'
import { Code, Link, Snippet } from '@nextui-org/react'
import { useCallback } from 'react'
import { formatUnits } from 'viem'

import { Timestamp } from 'components/Timestamp'
import type { Key, Row } from 'components/VirtualizedTable'
import {
	CRC_TOKEN_DECIMALS,
	CRC_TOKEN_SYMBOL,
	EXPLORER_URL
} from 'constants/common'
import { LABELS_MAPPER } from 'constants/events'
import { AvatarAddress } from 'shared/AvatarAddress'
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
					if (
						(item.truster && item.trustee) ||
						(item.canSendTo && item.user) ||
						(item.inviter && item.invited)
					) {
						const trusterAddress = String(
							item.truster || item.canSendTo || item.inviter
						)
						const trusteeAddress = String(
							item.trustee || item.user || item.invited
						)

						return (
							<div className='flex items-center justify-start'>
								<AvatarAddress
									address={trusterAddress}
									onClick={applyAvatarSearch}
									className='mr-0 md:mr-2'
								/>
								{' -> '}
								<AvatarAddress
									address={trusteeAddress}
									onClick={applyAvatarSearch}
									className='ml-0 md:ml-2'
								/>
							</div>
						)
					}

					if (
						item.from &&
						item.to &&
						(item.tokenAddress || item.id) &&
						(item.amount || item.value)
					) {
						const fromAddress = String(item.from)
						const toAddress = String(item.to)

						return (
							<div className='flex flex-row items-center justify-start md:w-[400px]'>
								<div className='flex items-center'>
									<AvatarAddress
										address={fromAddress}
										onClick={applyAvatarSearch}
										className='mr-2'
									/>
									{' -> '}
									<AvatarAddress
										address={toAddress}
										onClick={applyAvatarSearch}
										className='ml-2 mr-2'
									/>
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
							<div className='flex flex-row'>
								<AvatarAddress
									address={String(item.human)}
									onClick={applyAvatarSearch}
									className='ml-0 mr-2'
								/>
								<div className='min-w-[100px]'>
									{Number(
										formatUnits(BigInt(item.amount), CRC_TOKEN_DECIMALS)
										// eslint-disable-next-line @typescript-eslint/no-magic-numbers
									).toFixed(4)}{' '}
									{CRC_TOKEN_SYMBOL}
								</div>
							</div>
						)
					}

					if (
						item.user ||
						item.avatar ||
						item.organization ||
						item.group ||
						item.account ||
						item.operator
					) {
						return (
							<AvatarAddress
								address={String(
									// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
									item.user ??
										item.avatar ??
										item.organization ??
										item.group ??
										item.account ??
										item.operator
								)}
								onClick={applyAvatarSearch}
								className='ml-0 mr-2'
							/>
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
