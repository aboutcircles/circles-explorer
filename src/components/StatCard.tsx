import { Card, CardHeader, CardBody, Spinner, Tooltip } from '@nextui-org/react'

import { prettifyNumber } from 'utils/number'

interface StatCardProperties {
	label: string
	value: number
	isLoading: boolean
	progressValue1?: number
	progressValue2?: number
}

// const PERCENTAGE = 100

export function StatCard({
	label,
	value,
	isLoading,
	progressValue1 = 0,
	progressValue2 = 0
}: StatCardProperties) {
	return (
		<Tooltip
			content={`${prettifyNumber(progressValue2)} V2 / ${prettifyNumber(progressValue1)} V1`}
		>
			<Card className='m-2 mt-8 w-[165px] border-1 sm:w-[200px] md:w-[305px]'>
				<CardHeader className='flex pb-1 pl-3 pt-3'>
					<div className='text-sm text-grayText'>{label}</div>
				</CardHeader>
				<CardBody className='pb-3 pl-3 pt-1'>
					{isLoading ? (
						<Spinner />
					) : (
						<p className='flex text-3xl'>{prettifyNumber(value)}</p>
					)}
				</CardBody>
			</Card>
		</Tooltip>
	)
}

// <Progress
// 	size='sm'
// 	color='primary'
// 	aria-label='Loading V2'
// 	value={(progressValue2 / progressValue1) * PERCENTAGE}
// />

StatCard.defaultProps = {
	progressValue1: 0,
	progressValue2: 0
}
