import { Card, CardHeader, CardBody, Divider, Spinner } from '@nextui-org/react'

interface StatCardProperties {
	label: string
	value: number
	isLoading: boolean
}

export function StatCard({ label, value, isLoading }: StatCardProperties) {
	return (
		<Card className='m-5 w-[250px]'>
			<CardHeader className='flex justify-center gap-3'>
				<div className='text-xl'>{label}</div>
			</CardHeader>
			<Divider />
			<CardBody>
				{isLoading ? (
					<Spinner />
				) : (
					<p className='flex justify-center text-3xl'>{value}</p>
				)}
			</CardBody>
			<Divider />
		</Card>
	)
}
