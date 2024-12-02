import { RadioGroup } from '@nextui-org/react'
import { useEffect } from 'react'

import { CustomRadio } from 'components/CustomRadio'
import { periods, useFilterStore } from 'stores/useFilterStore'
import type { PeriodKey } from 'stores/useFilterStore'

export function Periods({ address }: { address: string | null }) {
	const period = useFilterStore.use.period()
	const updatePeriod = useFilterStore.use.updatePeriod()

	useEffect(() => {
		if (address) {
			updatePeriod('1W')
		} else {
			updatePeriod('12H')
		}
	}, [address, updatePeriod])

	return (
		<RadioGroup
			classNames={{
				wrapper: 'flex-row mr-2'
			}}
			value={period}
			onValueChange={(period_) => updatePeriod(period_ as PeriodKey)}
		>
			{Object.values(periods)
				// todo: hide periods for txHash / blockNumber
				.filter((period_) =>
					address
						? period_.show.includes('avatar')
						: period_.show.includes('all')
				)
				.map((period_) => (
					<CustomRadio key={period_.label} value={period_.label}>
						{period_.label}
					</CustomRadio>
				))}
		</RadioGroup>
	)
}
