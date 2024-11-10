import { useNavigate } from 'react-router-dom'
import { Divider } from '@nextui-org/react'
import { Search } from 'shared/Search'

export function Header() {
	const navigate = useNavigate()

	return (
		<div className=''>
			<div className='flex justify-between p-3 md:mx-8'>
				{/* eslint-disable-next-line jsx-a11y/no-static-element-interactions,jsx-a11y/click-events-have-key-events */}
				<div
					className='flex cursor-pointer items-center'
					onClick={() => navigate('/')}
				>
					<img src='/icons/logo.svg' alt='Logo' width={32} height={32} />
					<h1 className='text-xl font-bold'>
						<span className='text-primary'>Circles</span>{' '}
						<span className='text-secondary'>Explorer</span>
					</h1>
				</div>

				<Search />
			</div>

			<Divider />
		</div>
	)
}
