import { useCirclesStats } from 'hooks/useCirclesStats'
import { StatCard } from 'components/StatCard'

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
		label: 'Groups (V2)',
		key: 'groupCountV2'
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
	}
]

export function Stats() {
	const { isLoading, ...statsValues } = useCirclesStats()

	return (
		<div className='flex flex-row flex-wrap justify-center'>
			{stats.map((stat) => (
				<StatCard
					key={stat.label}
					label={stat.label}
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					value={statsValues[stat.key] + (statsValues[stat.key2] ?? 0)}
					isLoading={isLoading}
				/>
			))}
		</div>
	)
}