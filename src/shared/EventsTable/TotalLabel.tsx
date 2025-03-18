import { useFilterStore } from 'stores/useFilterStore'

interface TotalLabelProperties {
	eventsLength: number
}

export function TotalLabel({ eventsLength }: TotalLabelProperties) {
	const startBlock = useFilterStore.use.startBlock()

	return (
		<div className='flex items-center justify-between'>
			<span className='text-small text-default-400'>
				<span className='font-semibold text-black'>
					Total Events: {eventsLength === 0 ? '...' : eventsLength}
				</span>
				{startBlock > 0 && (
					<span className='ml-2 text-small text-default-400'>
						(From Block: {startBlock})
					</span>
				)}
			</span>
		</div>
	)
}
