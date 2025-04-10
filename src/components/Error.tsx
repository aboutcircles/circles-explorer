import { Button, Card, CardBody } from '@nextui-org/react'

export function Error() {
	return (
		<Card className='my-4 border-1 border-danger'>
			<CardBody className='text-center'>
				<h3 className='mb-2 text-danger'>Failed to load graph visualization</h3>
				<p className='mb-4 text-sm text-gray-600'>
					The trust graph visualization couldnt be loaded.
				</p>
				<Button color='primary' onPressEnd={() => window.location.reload()}>
					Reload
				</Button>
			</CardBody>
		</Card>
	)
}
