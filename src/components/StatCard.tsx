import {
	Card,
	CardHeader,
	CardBody,
	Spinner,
	Progress,
	Tooltip
} from '@nextui-org/react'

import { prettifyNumber } from 'utils/number'

interface StatCardProperties {
	label: string
	value: number
	isLoading: boolean
	progressValue1?: number
	progressValue2?: number
}

const PERCENTAGE = 100

export function StatCard({
	label,
	value,
	isLoading,
	progressValue1 = 0,
	progressValue2 = 0
}: StatCardProperties) {
	return (
		<Card className='m-5 w-[250px]'>
			<CardHeader className='flex justify-center gap-3'>
				<div className='text-xl'>{label}</div>
			</CardHeader>
			<Tooltip
				content={`${prettifyNumber(progressValue2)} V2 / ${prettifyNumber(progressValue1)} V1`}
			>
				<Progress
					size='sm'
					color='primary'
					aria-label='Loading V2'
					value={(progressValue2 / progressValue1) * PERCENTAGE}
				/>
			</Tooltip>
			<CardBody>
				{isLoading ? (
					<Spinner />
				) : (
					<p className='flex justify-center text-3xl'>
						{prettifyNumber(value)}
					</p>
				)}
			</CardBody>
		</Card>
	)
}

StatCard.defaultProps = {
	progressValue1: 0,
	progressValue2: 0
}
