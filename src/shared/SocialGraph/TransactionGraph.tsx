import type { ReactElement } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Loader } from 'components/Loader'
import type { TransactionData } from 'types/transaction'

import { AnimationControls } from './components/AnimationControls'
import { useTransactionGraphData } from './hooks/useTransactionGraphData'
import { SocialGraph } from './SocialGraph'

interface TransactionTrustGraphProperties {
	transactionData: TransactionData | null
	isLoading?: boolean
}

const DEFAULT_CONTAINER_WIDTH = 600

const highlightNodes = new Set()
const highlightLinks = new Set()

export function TransactionGraph({
	transactionData,
	isLoading = false
}: TransactionTrustGraphProperties): ReactElement {
	const graphReference = useRef<unknown>()
	const containerReference = useRef<HTMLDivElement>(null)
	const [containerWidth, setContainerWidth] = useState(DEFAULT_CONTAINER_WIDTH)

	// Use transaction graph data hook
	const {
		graphData,
		animatedTransfers,
		isAnimationPlaying,
		animationSpeed,
		handlePlayPause,
		handleReset,
		handleStepForward,
		handleStepBackward,
		handleSpeedChange,
		showTransferTooltips,
		currentTransferIndex,
		transferQueue
	} = useTransactionGraphData(transactionData)

	// Handle container resize
	useEffect(() => {
		if (containerReference.current) {
			setContainerWidth(containerReference.current.clientWidth)
		}

		const handleResize = () => {
			if (containerReference.current) {
				setContainerWidth(containerReference.current.clientWidth)
			}
		}

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	// Handle node interactions (simplified for transaction context)
	const handleNodeHover = useCallback(() => {
		// For now, no hover interactions in transaction graph
	}, [])

	const handleNodeClick = useCallback(() => {
		// For now, no click interactions in transaction graph
	}, [])

	if (isLoading) {
		return <Loader />
	}

	if (!transactionData || graphData.nodes.length === 0) {
		return (
			<div className='flex min-h-[400px] items-center justify-center'>
				<div className='text-center'>
					<h3 className='mb-2 text-lg font-medium text-gray-900'>
						No Transfer Graph Available
					</h3>
					<p className='text-gray-500'>
						{/* eslint-disable-next-line react/no-unescaped-entities */}
						This transaction doesn't contain transfer events that can be
						visualized.
					</p>
				</div>
			</div>
		)
	}

	return (
		<div
			className='transaction-trust-graph-container'
			style={{ height: '100%', width: '100%' }}
			ref={containerReference}
		>
			{/* Animation Controls */}
			<div className='mb-4 flex justify-center'>
				<AnimationControls
					isPlaying={isAnimationPlaying}
					onPlayPause={handlePlayPause}
					onReset={handleReset}
					onStepForward={handleStepForward}
					onStepBackward={handleStepBackward}
					speed={animationSpeed}
					onSpeedChange={handleSpeedChange}
					currentStep={currentTransferIndex}
					totalSteps={transferQueue.length}
				/>
			</div>

			{/* Graph Visualization */}
			<SocialGraph
				graphReference={graphReference}
				graphData={graphData}
				highlightNodes={highlightNodes}
				highlightLinks={highlightLinks}
				handleNodeHover={handleNodeHover}
				handleNodeClick={handleNodeClick}
				width={containerWidth}
				animatedTransfers={animatedTransfers}
				isAnimationPlaying={isAnimationPlaying}
				showTransferTooltips={showTransferTooltips}
				height={600}
			/>

			{/* Info Panel */}
			<div className='mt-4 text-center text-sm text-gray-600'>
				<p>
					Showing {graphData.nodes.length} participants and{' '}
					{graphData.links.length} transfers
				</p>
				{animatedTransfers.length > 0 && (
					<p className='mt-1'>
						{isAnimationPlaying ? '▶️ Playing' : '⏸️ Paused'} •{' '}
						{animatedTransfers.length} animated transfers
					</p>
				)}
			</div>
		</div>
	)
}

TransactionGraph.defaultProps = {
	isLoading: false
}
