import { useMemo } from 'react'
import { Tooltip } from '@nextui-org/react'
import dayjs from 'dayjs'

import { MILLISECONDS_IN_A_SECOND } from 'constants/time'

export function Timestamp({ value }: { value: number }) {
	const date = useMemo(() => {
		const timestampMs = value * MILLISECONDS_IN_A_SECOND
		return dayjs(timestampMs)
	}, [value])

	return (
		<Tooltip size='sm' content={date.format('YYYY-MMM-DD HH:mm:ss')}>
			{dayjs().to(date)}
		</Tooltip>
	)
}
