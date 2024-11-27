import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button
} from '@nextui-org/react'

import { Filter } from 'shared/Filter'
import { Search } from './Search'

export function SearchModal({
	isOpen,
	onOpenChange,
	onOpen
}: {
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
	onOpen: () => void
}) {
	return (
		<Modal
			isOpen={isOpen}
			placement='top'
			onOpenChange={onOpenChange}
			size='full'
			hideCloseButton
		>
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader className='mb-2 flex flex-col gap-1' />
						<ModalBody>
							<Search onOpen={onOpen} isSearchBox onSubmit={onClose} />

							<Filter />
						</ModalBody>
						<ModalFooter>
							<Button color='primary' onPress={onClose}>
								Save
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	)
}
