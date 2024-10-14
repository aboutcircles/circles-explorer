import type { CirclesEventType } from '@circles-sdk/data'
import { Code, Link, Snippet, Tooltip } from '@nextui-org/react'
import dayjs from 'dayjs'
import { useCallback } from 'react'
import { formatUnits } from 'viem'
import { Link as RouterLink } from 'react-router-dom'

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
					return <EyePopoverDetails item={item} />
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
				case 'details': {
					if ((item.truster && item.trustee) || (item.canSendTo && item.user)) {
						return (
							<div className='flex justify-around'>
								<RouterLink
									className='text-blue-500'
									to={`/avatar/${item.truster || item.canSendTo}`}
								>
									{truncateHex(String(item.truster || item.canSendTo))}
								</RouterLink>
								{' -> '}
								<RouterLink
									className='text-blue-500'
									to={`/avatar/${item.trustee || item.user}`}
								>
									{truncateHex(String(item.trustee || item.user))}
								</RouterLink>
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
							<div className='flex flex-col items-center'>
								<div>
									<RouterLink
										className='text-blue-500'
										to={`/avatar/${item.from}`}
									>
										{truncateHex(String(item.from))}
									</RouterLink>
									{' -> '}
									<RouterLink
										className='text-blue-500'
										to={`/avatar/${item.to}`}
									>
										{truncateHex(String(item.to))}
									</RouterLink>
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
							<div className='flex justify-center'>
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
		[onEventClick]
	)
}
