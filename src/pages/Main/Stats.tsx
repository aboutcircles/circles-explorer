import type { CirclesEventType } from '@circles-sdk/data'
import { StatCard } from 'components/StatCard'
import { TWO } from 'constants/common'
import { useCirclesStats } from 'hooks/useCirclesStats'
import { useCallback, useMemo } from 'react'
import { useFilterStore } from 'stores/useFilterStore'

interface Stat {
	label: string
	key?: string
	key2?: string
	events: CirclesEventType[]
}

const stats: Stat[] = [
	{
		label: 'Avatars',
		key: 'avatarCountV1',
		key2: 'avatarCountV2',
		events: [
			'CrcV1_Signup',
			'CrcV1_OrganizationSignup',
			'CrcV2_RegisterHuman',
			'CrcV2_RegisterGroup',
			'CrcV2_RegisterOrganization'
		]
	},
	{
		label: 'Organizations',
		key: 'organizationCountV1',
		key2: 'organizationCountV2',
		events: ['CrcV1_OrganizationSignup', 'CrcV2_RegisterOrganization']
	},
	{
		label: 'Humans',
		key: 'humanCountV1',
		key2: 'humanCountV2',
		events: ['CrcV1_Signup', 'CrcV2_RegisterHuman']
	},
	{
		label: 'Groups',
		key2: 'groupCountV2',
		events: ['CrcV2_RegisterGroup']
	},
	{
		label: 'Circles Transfers',
		key: 'circlesTransferCountV1',
		key2: 'circlesTransferCountV2',
		events: [
			'CrcV1_Transfer',
			'CrcV2_TransferSingle',
			'CrcV2_TransferBatch',
			'CrcV2_StreamCompleted'
		]
	},
	{
		label: 'Trust',
		key: 'trustCountV1',
		key2: 'trustCountV2',
		events: ['CrcV1_Trust', 'CrcV2_Trust']
	},
	{
		label: 'Tokens',
		key: 'tokenCountV1',
		key2: 'tokenCountV2',
		events: []
	},
	{
		label: 'Transitive Transfers',
		key: 'transitiveTransferCountV1',
		key2: 'transitiveTransferCountV2',
		events: []
	}
]

const STATS_MOBILE_NUMBER_IN_ROW = 3

export function Stats() {
	const { isLoading, ...statsValues } = useCirclesStats()
	const selectedEventTypes = useFilterStore.use.eventTypes()
	const updateEventTypesBatch = useFilterStore.use.updateEventTypesBatch()

	const isStatHighlighted = useMemo(
		() => (events: CirclesEventType[]) => {
			if (events.length === 0) return false
			return events.every((event) => selectedEventTypes.has(event))
		},
		[selectedEventTypes]
	)

	const onCardClick = useCallback(
		(events: CirclesEventType[]) => {
			updateEventTypesBatch(events)
		},
		[updateEventTypesBatch]
	)

	return (
		<>
			<div className='mb-4 hidden flex-row flex-wrap justify-center sm:flex'>
				{stats.map((stat) => (
					<StatCard
						key={stat.label}
						label={stat.label}
						handleClick={() => onCardClick(stat.events)}
						isHighlighted={isStatHighlighted(stat.events)}
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
							handleClick={() => onCardClick(stat.events)}
							isHighlighted={isStatHighlighted(stat.events)}
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
								handleClick={() => onCardClick(stat.events)}
								isHighlighted={isStatHighlighted(stat.events)}
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
							handleClick={() => onCardClick(stat.events)}
							isHighlighted={isStatHighlighted(stat.events)}
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
