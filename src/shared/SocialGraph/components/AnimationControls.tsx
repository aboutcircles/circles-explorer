import { Button } from '@nextui-org/react'
import type { ReactElement } from 'react'

import { ONE, PERCENTAGE_DIVIDER } from 'constants/common'

const SPEED_HALF = 0.5
const SPEED_NORMAL = 1
const SPEED_DOUBLE = 2
const SPEED_QUAD = 4

interface AnimationControlsProperties {
	isPlaying: boolean
	onPlayPause: () => void
	onReset?: () => void
	onStepForward?: () => void
	onStepBackward?: () => void
	speed: number
	onSpeedChange: (speed: number) => void
	currentStep?: number
	totalSteps?: number
	className?: string
}

export function AnimationControls({
	isPlaying,
	onPlayPause,
	onReset,
	onStepForward,
	onStepBackward,
	speed,
	onSpeedChange,
	currentStep = 0,
	totalSteps = 0,
	className = ''
}: AnimationControlsProperties): ReactElement {
	const speedOptions = [
		{ value: SPEED_HALF, label: '0.5x' },
		{ value: SPEED_NORMAL, label: '1x' },
		{ value: SPEED_DOUBLE, label: '2x' },
		{ value: SPEED_QUAD, label: '4x' }
	]

	return (
		<div className={`flex flex-col items-center gap-3 ${className}`}>
			{/* Progress Indicator */}
			{totalSteps > 0 && (
				<div className='text-center'>
					<div className='mb-1 text-sm text-gray-600'>
						Transfer {currentStep + ONE} of {totalSteps}
					</div>
					<div className='h-2 w-64 rounded-full bg-gray-200'>
						<div
							className='h-2 rounded-full bg-primary transition-all duration-300'
							style={{
								width: `${((currentStep + ONE) / totalSteps) * PERCENTAGE_DIVIDER}%`
							}}
						/>
					</div>
				</div>
			)}

			{/* Controls Row */}
			<div className='flex items-center gap-3'>
				{/* Step Backward */}
				{onStepBackward ? (
					<Button
						color='default'
						variant='bordered'
						size='sm'
						onPress={onStepBackward}
						isDisabled={currentStep <= 0}
						startContent={<span className='text-sm'>⏮️</span>}
					>
						Prev
					</Button>
				) : null}

				{/* Play/Pause Button */}
				<Button
					color='primary'
					variant='solid'
					size='sm'
					onPress={onPlayPause}
					startContent={
						<span className='text-sm'>{isPlaying ? '⏸️' : '▶️'}</span>
					}
				>
					{isPlaying ? 'Pause' : 'Play'}
				</Button>

				{/* Step Forward */}
				{onStepForward ? (
					<Button
						color='default'
						variant='bordered'
						size='sm'
						onPress={onStepForward}
						isDisabled={currentStep >= totalSteps - ONE}
						startContent={<span className='text-sm'>⏭️</span>}
					>
						Next
					</Button>
				) : null}

				{/* Reset Button */}
				{onReset ? (
					<Button
						color='default'
						variant='bordered'
						size='sm'
						onPress={onReset}
						startContent={<span className='text-sm'>🔄</span>}
					>
						Reset
					</Button>
				) : null}

				{/* Speed Control */}
				<div className='flex items-center gap-2'>
					<span className='text-sm text-gray-600'>Speed:</span>
					<div className='flex gap-1'>
						{speedOptions.map((option) => (
							<Button
								key={option.value}
								size='sm'
								variant={speed === option.value ? 'solid' : 'bordered'}
								color={speed === option.value ? 'primary' : 'default'}
								onPress={() => onSpeedChange(option.value)}
								className='min-w-12 px-2'
							>
								{option.label}
							</Button>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

AnimationControls.defaultProps = {
	className: '',
	currentStep: 0,
	onReset: undefined,
	onStepBackward: () => {},
	onStepForward: () => {},
	totalSteps: 0
}
