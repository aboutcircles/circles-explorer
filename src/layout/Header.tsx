import { useNavigate } from 'react-router-dom'
import { Divider, useDisclosure } from '@nextui-org/react'
import { Search } from 'shared/Search/Search'
import { SearchModal } from '../shared/Search'

export function Header() {
	const { isOpen, onOpen, onOpenChange } = useDisclosure()

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

				<Search onOpen={onOpen} />
				<SearchModal
					onOpen={onOpen}
					isOpen={isOpen}
					onOpenChange={onOpenChange}
				/>
			</div>

			<Divider />
		</div>
	)
}
