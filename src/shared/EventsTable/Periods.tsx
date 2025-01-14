import { RadioGroup } from '@nextui-org/react'

import { CustomRadio } from 'components/CustomRadio'
import type { PeriodKey } from 'stores/useFilterStore'
import { periods, useFilterStore } from 'stores/useFilterStore'

export function Periods({ address }: { address: string | null }) {
	const period = useFilterStore.use.period()
	const updatePeriod = useFilterStore.use.updatePeriod()

	return (
		<RadioGroup
			classNames={{
				wrapper: 'flex-row gap-2 mr-2'
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
