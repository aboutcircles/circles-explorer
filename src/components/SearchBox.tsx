import { useState, useCallback, useEffect } from 'react'
import { Input, Button } from '@nextui-org/react'
import type React from 'react'
import { isAddress, isHash } from 'viem'

interface SearchProperties {
	handleSubmit: (search: string) => void
	handleChange?: (search: string) => void
	placeholder: string
	outerSearch: string
}

export function SearchBox({
	handleSubmit,
	handleChange,
	placeholder,
	outerSearch
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
					label: 'text-black/50 dark:text-white/90',
					input: [
						'bg-transparent',
						'border-0',
						'rounded-md',
						'text-black/90 dark:text-white/90',
						'placeholder:text-default-700/50 dark:placeholder:text-white/60'
					],
					innerWrapper: 'bg-transparent',
					mainWrapper: 'w-[400px]',
					inputWrapper: [
						'bg-transparent',
						'dark:bg-default/60',
						'border-0',
						'backdrop-blur-xl',
						'backdrop-saturate-200',
						'hover:bg-default-200/70',
						'dark:hover:bg-default/70',
						'group-data-[focus=true]:bg-default-200/50',
						'dark:group-data-[focus=true]:bg-default/60',
						'!cursor-text'
					]
				}}
				placeholder={placeholder}
				type='text'
				onChange={onChange}
				onKeyDown={handleKeyDown}
				value={search}
			/>

			<Button
				onPress={onSubmit}
				isIconOnly
				className='ml-2'
				color='primary'
				isDisabled={!isAddress(search) && !isHash(search)}
			>
				{outerSearch && outerSearch === search ? (
					<img
						src='/icons/close.svg'
						alt='Submit'
						className='fg-white h-5 w-5'
					/>
				) : (
					<img
						src='/icons/search.svg'
						alt='Submit'
						className='fg-white h-5 w-5'
					/>
				)}
			</Button>
		</div>
	)
}

SearchBox.defaultProps = {
	handleChange: () => {}
}
