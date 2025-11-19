import {
	Button,
	Divider,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	useDisclosure
} from '@nextui-org/react'
import { ChevronDownIcon } from '@nextui-org/shared-icons'
import { useNavigate } from 'react-router-dom'
import { Search, SearchModal } from 'shared/Search'
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
				<div className='flex items-center gap-4'>
					{/* eslint-disable-next-line jsx-a11y/no-static-element-interactions,jsx-a11y/click-events-have-key-events */}
					<div
						className='flex cursor-pointer items-center'
						onClick={handleLogoClick}
					>
						<img src='/icons/logo.svg' alt='Logo' width={32} height={32} />
						<h1 className='text-xl font-bold'>
							<span className='dm-sans font-bold text-primary'>Circles</span>{' '}
							<span className='dm-sans font-bold text-secondary'>Explorer</span>
						</h1>
					</div>

					{/* Legal dropdown */}
					<Dropdown>
						<DropdownTrigger>
							<Button
								variant='light'
								size='sm'
								className='h-8 w-8 min-w-0 px-2 text-primary'
								isIconOnly
								aria-label='Legal'
								endContent={<ChevronDownIcon className='h-5 w-5' />}
							/>
						</DropdownTrigger>
						<DropdownMenu aria-label='Legal pages' className='min-w-40'>
							<DropdownItem key='terms' onPress={() => navigate('/terms')}>
								Terms of use
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				</div>

				<Search onOpen={onOpen} />
				{isOpen ? (
					<SearchModal
						onOpen={onOpen}
						isOpen={isOpen}
						onOpenChange={onOpenChange}
					/>
				) : null}
			</div>

			<Divider />
		</div>
	)
}
