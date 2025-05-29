import { Divider, useDisclosure } from '@nextui-org/react'
import { useNavigate } from 'react-router-dom'
import { SearchModal } from 'shared/Search'
import { Search } from 'shared/Search/Search'
import { useFilterStore } from 'stores/useFilterStore'

export function Header() {
	const { isOpen, onOpen, onOpenChange } = useDisclosure()
	const updateSearch = useFilterStore.use.updateSearch()
	const navigate = useNavigate()

	const handleLogoClick = () => {
		updateSearch('')
		navigate('/')
	}

	return (
		<div className=''>
			<div className='flex justify-between p-3 md:mx-8'>
				{/* eslint-disable-next-line jsx-a11y/no-static-element-interactions,jsx-a11y/click-events-have-key-events */}
				<div
					className='flex cursor-pointer items-center'
					onClick={handleLogoClick}
				>
					<img src='/icons/logo.svg' alt='Logo' width={32} height={32} />
					<h1 className='text-xl font-bold'>
						<span
							className='font-medium text-primary'
							style={{ fontFamily: 'DM Sans', fontWeight: '800' }}
						>
							Circles
						</span>{' '}
						<span
							className='font-medium text-secondary'
							style={{ fontFamily: 'DM Sans', fontWeight: '800' }}
						>
							Explorer
						</span>
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
