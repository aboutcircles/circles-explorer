import { Input, Button } from '@nextui-org/react'
import type React from 'react'

interface SearchProperties {
	onChange: React.ChangeEventHandler<HTMLInputElement>
	onSubmit: () => void
	placeholder: string
}

export function Search({
	onChange,
	onSubmit,
	placeholder
}: SearchProperties): React.ReactElement {
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
			/>

			<Button onPress={onSubmit} className='ml-2' color='primary'>
				<img src='/icons/search.svg' alt='' className='fg-white h-5 w-5' />
			</Button>
		</div>
	)
}
