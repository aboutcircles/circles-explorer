import { Spinner } from '@nextui-org/react'

export function Loader() {
	return (
		<div className='flex h-60 w-full items-center justify-center'>
			<Spinner size='lg' />
		</div>
	)
}
