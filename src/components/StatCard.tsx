import { Card, CardBody, CardHeader, Spinner } from '@nextui-org/react'

import { prettifyNumber } from 'utils/number'

interface StatCardProperties {
	label: string
	value: number
	isLoading: boolean
	progressValue1?: number
	progressValue2?: number
	isMobile?: boolean
	isHighlighted?: boolean
	handleClick: () => void
}

export function StatCard({
	label,
	value,
	isLoading,
	progressValue1 = 0,
	progressValue2 = 0,
	isMobile = false,
	isHighlighted = false,
	handleClick
}: StatCardProperties) {
	return (
		// eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
		<div onClick={handleClick}>
			{isMobile ? (
				<div
					className={`hover:cursor-pointer ${
						isHighlighted ? 'border-l-4 border-primary pl-1' : ''
					}`}
				>
					<p className='text-sm font-medium text-gray-500'>{label}</p>
					{isLoading ? (
						<Spinner />
					) : (
						<p className='text-2xl font-semibold text-gray-900'>
							{prettifyNumber(value)}
						</p>
					)}
				</div>
			) : (
				<Card
					className={`m-2 mt-8 w-[165px] border-1 hover:cursor-pointer sm:w-[200px] md:w-[305px] ${
						isHighlighted ? 'border-primary bg-primary-50' : ''
					}`}
				>
					<CardHeader className='flex pb-1 pl-3 pt-3'>
						<div className='text-sm text-grayText'>{label}</div>
					</CardHeader>
					<CardBody className='pb-3 pl-3 pt-1'>
						{isLoading ? (
							<Spinner />
						) : (
							<>
								<p className='flex text-3xl'>{prettifyNumber(value)}</p>
								<span className='text-xs'>
									{prettifyNumber(progressValue2)} V2 /
									{` ${prettifyNumber(progressValue1)}`} V1
								</span>
							</>
						)}
					</CardBody>
				</Card>
			)}
		</div>
	)
}

StatCard.defaultProps = {
	isHighlighted: false,
	isMobile: false,
	progressValue1: 0,
	progressValue2: 0
}
