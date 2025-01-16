import { Button, Input } from '@nextui-org/react'
import debounce from 'lodash.debounce'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchProfileByName, type Profile } from 'services/circlesIndex'
import { isAddress, isHash } from 'viem'

const MIN_SEARCH_LENGTH = 2
const DEBOUNCE_DELAY = 300

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
	const [nameSearch, setNameSearch] = useState('')
	const [isOpen, setIsOpen] = useState(false)
	const inputReference = useRef<HTMLInputElement>(null)
	const dropdownReference = useRef<HTMLDivElement>(null)
	const { data: searchResults, isLoading } = useSearchProfileByName(
		nameSearch &&
			nameSearch.length >= MIN_SEARCH_LENGTH &&
			!isAddress(nameSearch) &&
			!isHash(nameSearch)
			? nameSearch
			: ''
	) as {
		data: Profile[] | undefined
		isLoading: boolean
	}

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownReference.current &&
				!dropdownReference.current.contains(event.target as Node) &&
				!inputReference.current?.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	const debouncedSearch = useMemo(
		() =>
			debounce((value: string) => {
				if (
					value &&
					value.length >= MIN_SEARCH_LENGTH &&
					!isAddress(value) &&
					!isHash(value)
				) {
					setIsOpen(true)
					setNameSearch(value)
				} else {
					setIsOpen(false)
					setNameSearch('')
				}
			}, DEBOUNCE_DELAY),
		[]
	)

	useEffect(() => {
		setSearch(outerSearch)
		if (!outerSearch) {
			setNameSearch('')
			setIsOpen(false)
		}
	}, [outerSearch])

	const onChange = useCallback(
		(event_: { target: { value: React.SetStateAction<string> } }) => {
			const value = event_.target.value as string
			if (value === '') {
				handleSubmit('')
				setIsOpen(false)
				setNameSearch('')
			}

			setSearch(value)
			handleChange?.(value)
			debouncedSearch(value)
		},
		[handleChange, handleSubmit, debouncedSearch]
	)

	const handleSelectProfile = useCallback(
		(profile: Profile) => {
			setSearch(profile.address)
			setNameSearch('')
			setIsOpen(false)
			handleSubmit(profile.address)
		},
		[handleSubmit]
	)

	const onSubmit = useCallback(() => {
		if (outerSearch && outerSearch === search) {
			handleSubmit('')
			setSearch('')
			setNameSearch('')
			setIsOpen(false)
		} else {
			handleSubmit(search)
		}
	}, [handleSubmit, search, outerSearch])

	const handleKeyDown = useCallback(
		(event_: React.KeyboardEvent<HTMLInputElement>) => {
			if (event_.key === 'Enter') {
				event_.preventDefault()
				handleSubmit(search)
			}
		},
		[handleSubmit, search]
	)

	return (
		<div className='relative flex'>
			<div className='flex'>
				<Input
					ref={inputReference}
					data-testid='search-input'
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
					placeholder={placeholder}
					onChange={onChange}
					onMouseOver={() => setIsOpen(true)}
					value={search}
					onKeyDown={handleKeyDown}
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

			{isOpen && nameSearch && searchResults?.length ? (
				<div
					ref={dropdownReference}
					className='absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-default-200 bg-content1 p-2 shadow-lg'
				>
					<div className='max-h-[300px] w-full overflow-auto'>
						{isLoading ? (
							<div className='py-2 text-center'>Loading...</div>
						) : (
							searchResults.map((profile: Profile) => (
								<button
									type='button'
									key={profile.address}
									className='w-full cursor-pointer rounded p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800'
									onClick={() => handleSelectProfile(profile)}
								>
									<div className='font-medium'>{profile.name}</div>
									<div className='truncate text-sm text-gray-500'>
										{profile.address}
									</div>
								</button>
							))
						)}
					</div>
				</div>
			) : null}
		</div>
	)
}

SearchBox.defaultProps = {
	className: '',
	handleChange: () => {},
	placeholder: 'Search'
}
