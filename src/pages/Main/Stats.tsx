import { useCirclesStats } from 'hooks/useCirclesStats'
import { StatCard } from 'components/StatCard'
import { TWO } from 'constants/common'

const stats = [
	{
		label: 'Avatars',
		key: 'avatarCountV1',
		key2: 'avatarCountV2'
	},
	{
		label: 'Organizations',
		key: 'organizationCountV1',
		key2: 'organizationCountV2'
	},
	{
		label: 'Humans',
		key: 'humanCountV1',
		key2: 'humanCountV2'
	},
	{
		label: 'Groups',
		key2: 'groupCountV2'
	},
	{
		label: 'Circles Transfers',
		key: 'circlesTransferCountV1',
		key2: 'circlesTransferCountV2'
	},
	{
		label: 'Trust',
		key: 'trustCountV1',
		key2: 'trustCountV2'
	},
	{
		label: 'Tokens',
		key: 'tokenCountV1',
		key2: 'tokenCountV2'
	},
	{
		label: 'Transitive Transfers',
		key: 'transitiveTransferCountV1',
		key2: 'transitiveTransferCountV2'
	}
]

const STATS_MOBILE_NUMBER_IN_ROW = 3

export function Stats() {
	const { isLoading, ...statsValues } = useCirclesStats()

	return (
		<>
			<div className='mb-4 hidden flex-row flex-wrap justify-center sm:flex'>
				{stats.map((stat) => (
					<StatCard
						key={stat.label}
						label={stat.label}
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-expect-error
						value={(statsValues[stat.key] ?? 0) + (statsValues[stat.key2] ?? 0)}
						isLoading={isLoading}
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-expect-error
						progressValue1={statsValues[stat.key]}
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-expect-error
						progressValue2={statsValues[stat.key2]}
					/>
				))}
			</div>

			<div className='mb-4 divide-y divide-gray-200 sm:hidden'>
				<div className='grid grid-cols-3 gap-y-6 py-4 text-center'>
					{stats.slice(0, STATS_MOBILE_NUMBER_IN_ROW).map((stat) => (
						<StatCard
							isMobile
							key={stat.label}
							label={stat.label}
							value={
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-expect-error
								(statsValues[stat.key] ?? 0) + (statsValues[stat.key2] ?? 0)
							}
							isLoading={isLoading}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-expect-error
							progressValue1={statsValues[stat.key]}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-expect-error
							progressValue2={statsValues[stat.key2]}
						/>
					))}
				</div>
				<div className='grid grid-cols-3 gap-y-6 py-4 text-center'>
					{stats
						.slice(STATS_MOBILE_NUMBER_IN_ROW, STATS_MOBILE_NUMBER_IN_ROW * TWO)
						.map((stat) => (
							<StatCard
								isMobile
								key={stat.label}
								label={stat.label}
								value={
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-expect-error
									(statsValues[stat.key] ?? 0) + (statsValues[stat.key2] ?? 0)
								}
								isLoading={isLoading}
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-expect-error
								progressValue1={statsValues[stat.key]}
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-expect-error
								progressValue2={statsValues[stat.key2]}
							/>
						))}
				</div>
				<div className='grid grid-cols-3 gap-y-6 py-4 text-center'>
					{stats.slice(STATS_MOBILE_NUMBER_IN_ROW * TWO).map((stat) => (
						<StatCard
							isMobile
							key={stat.label}
							label={stat.label}
							value={
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-expect-error
								(statsValues[stat.key] ?? 0) + (statsValues[stat.key2] ?? 0)
							}
							isLoading={isLoading}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-expect-error
							progressValue1={statsValues[stat.key]}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-expect-error
							progressValue2={statsValues[stat.key2]}
						/>
					))}
				</div>
			</div>
		</>
	)
}
