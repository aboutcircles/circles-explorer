interface TotalLabelProperties {
	eventsLength: number
	dateRange: { start: string; end: string }
	period: string
}

export function TotalLabel({
	eventsLength,
	dateRange,
	period
}: TotalLabelProperties) {
	return (
		<div className='flex items-center justify-between'>
			<span className='text-small text-default-400'>
				<span className='font-semibold text-black'>
					Total Events: {eventsLength === 0 ? '...' : eventsLength}
				</span>
				<span className='pl-2 text-xs'>
					({dateRange.start} - {dateRange.end}) ({period})
				</span>
			</span>
		</div>
	)
}
