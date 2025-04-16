import { Input } from '@nextui-org/react'
import debounce from 'lodash.debounce'
import { useCallback, useMemo, useState } from 'react'

const DEBOUNCE_DELAY = 300 // milliseconds

interface TrustSearchBoxProperties {
	onSearch: (term: string) => void
	placeholder?: string
	className?: string
}

export function TrustSearchBox({
	onSearch,
	placeholder = 'Search by name or address',
	className = ''
}: TrustSearchBoxProperties) {
	const [searchTerm, setSearchTerm] = useState('')

	const debouncedSearch = useMemo(
		() =>
			debounce((value: string) => {
				onSearch(value)
			}, DEBOUNCE_DELAY),
		[onSearch]
	)

	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const { value } = event.target
			setSearchTerm(value)
			debouncedSearch(value)
		},
		[debouncedSearch]
	)

	return (
		<Input
			type='text'
			placeholder={placeholder}
			value={searchTerm}
			onChange={handleChange}
			startContent={
				<img
					src='/icons/search.svg'
					alt='Search'
					className='h-5 w-5 invert filter'
				/>
			}
			className={className}
			variant='bordered'
			classNames={{
				input: [
					'bg-transparent',
					'text-black/90 dark:text-white/90',
					'placeholder:text-default-700/50 dark:placeholder:text-white/60',
					'appearance-none border-0 outline-none focus:outline-none focus:ring-0'
				],
				inputWrapper: [
					'shadow-none',
					'bg-transparent',
					'!cursor-text',
					'hover:bg-default-200/70',
					'dark:hover:bg-default-500/20'
				]
			}}
		/>
	)
}

TrustSearchBox.defaultProps = {
	className: '',
	placeholder: 'Search by name or address'
}
