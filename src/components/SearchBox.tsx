import { useState, useCallback, useEffect } from 'react'
import { Input, Button } from '@nextui-org/react'
import type React from 'react'
import { isAddress, isHash } from 'viem'

interface SearchProperties {
	handleSubmit: (search: string) => void
	handleChange?: (search: string) => void
	placeholder?: string
	outerSearch: string
	className?: string
}

export function SearchBox({
	handleSubmit,
	handleChange,
	placeholder,
	outerSearch,
	className
}: SearchProperties): React.ReactElement {
	const [search, setSearch] = useState<string>(outerSearch)

	useEffect(() => {
		setSearch(outerSearch)
	}, [outerSearch])

	const onChange = useCallback(
		(event_: { target: { value: React.SetStateAction<string> } }) => {
			if (event_.target.value === '') {
				handleSubmit('')
			}

			setSearch(event_.target.value)
			handleChange?.(event_.target.value as string)
		},
		[handleChange, handleSubmit]
	)

	const handleKeyDown = useCallback(
		(event_: React.KeyboardEvent<HTMLInputElement>) => {
			if (event_.key === 'Enter') {
				event_.preventDefault()
				handleSubmit(search)
			}
		},
		[handleSubmit, search]
	)

	const onSubmit = useCallback(() => {
		// clear option when same search
		if (outerSearch && outerSearch === search) {
			handleSubmit('')
			setSearch('')
		} else {
			handleSubmit(search)
		}
	}, [handleSubmit, search, outerSearch])

	return (
		<div className='flex'>
			<Input
				classNames={{
					input: [
						'bg-transparent',
						'border-0',
						'rounded-md',
						'text-black/90 dark:text-white/90',
						'placeholder:text-default-700/50 dark:placeholder:text-white/60',
						'focus:ring-0'
					],
					mainWrapper: `w-[170px] md:w-[320px] ${className}`
				}}
				variant='bordered'
				type='text'
				// todo: it stack sometimes
				// isClearable={outerSearch ? outerSearch === search : false}
				placeholder={placeholder}
				onChange={onChange}
				onKeyDown={handleKeyDown}
				value={search}
				onClear={onSubmit}
				startContent={
					<img
						src='/icons/search.svg'
						alt='Submit'
						className='h-5 w-5 invert filter'
					/>
				}
			/>

			<Button
				onPress={onSubmit}
				isIconOnly
				className='ml-2 disabled:cursor-not-allowed'
				color='primary'
				variant='faded'
				isDisabled={!isAddress(search) && !isHash(search)}
			>
				{outerSearch && outerSearch === search ? (
					<img
						src='/icons/close.svg'
						alt='Submit'
						className='h-5 w-5 invert filter'
					/>
				) : (
					<img
						src='/icons/search.svg'
						alt='Submit'
						className='h-5 w-5 invert filter'
					/>
				)}
			</Button>
		</div>
	)
}

SearchBox.defaultProps = {
	className: '',
	handleChange: () => {},
	placeholder: 'Search'
}
