import { useNavigate } from 'react-router-dom'

export function Header() {
	const navigate = useNavigate()

	return (
		<div className='bg-gray-100 p-2'>
			{/* eslint-disable-next-line jsx-a11y/no-static-element-interactions,jsx-a11y/click-events-have-key-events */}
			<div
				className='flex cursor-pointer items-center'
				onClick={() => navigate('/')}
			>
				<img src='/icons/circles-logo.avif' alt='Logo' />
				<h1 className='text-xl'>Circles Explorer</h1>
			</div>
		</div>
	)
}
