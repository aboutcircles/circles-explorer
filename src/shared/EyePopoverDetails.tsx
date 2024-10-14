import {
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@nextui-org/react'

import { KeyValuesTable } from 'shared/KeyValuesTable'
import type { Row } from 'components/Table'

export function EyePopoverDetails({ item }: { item: Row }) {
	return (
		<Popover size='sm'>
			<PopoverTrigger>
				<Button isIconOnly variant='faded'>
					<img className='h-[13px] w-[13px]' src='/icons/eye.svg' alt='Info' />
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				<div>
					<KeyValuesTable item={item} />
				</div>
			</PopoverContent>
		</Popover>
	)
}
