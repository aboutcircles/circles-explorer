import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatUnits } from 'viem'

import type { TransferEventValues } from 'types/events'
import { CRC_TOKEN_DECIMALS, ONE, TWO } from 'constants/common'
import { useProfilesCoordinator } from 'coordinators'
import type { TransactionData } from 'types/transaction'
import { truncateHex } from 'utils/eth'
import { useProfileStore } from 'stores/useProfileStore'

import type {
	AnimatedTransfer,
	EnhancedGraphData,
	TransactionNode,
	TransferLink
} from '../types'

const TRANSITION_COEFICIENT = 0.02 // Coefficient for transfer animation speed
const TRANSITION_DELAY = 50

// Colors for transaction graph
const TRANSACTION_COLORS = {
	INTERMEDIATE: '#FF9800', // Orange for intermediate nodes
	DEAD_ADDRESS: '#DC2626', // Red for dead address (fee burns)
	TRANSFER_LINK: '#4CAF50', // Green for transfer flows
	TRUST_EVENT_LINK: '#9C27B0', // Purple for trust events
	MINT_EVENT_LINK: '#FF9800' // Orange for mint events
}

export const useTransactionGraphData = (
	transactionData: TransactionData | null
) => {
	const { getProfile } = useProfilesCoordinator()
	const profiles = useProfileStore.use.profiles() // Make graph reactive to profile changes
	const [animatedTransfers, setAnimatedTransfers] = useState<
		AnimatedTransfer[]
	>([])
	const [isAnimationPlaying, setIsAnimationPlaying] = useState(false)
	const [animationSpeed, setAnimationSpeed] = useState(ONE)
	const [currentTransferIndex, setCurrentTransferIndex] = useState(0)
	const [transferQueue, setTransferQueue] = useState<AnimatedTransfer[]>([])

	// Helper function to extract event fields
	const extractEventFields = useCallback(
		(event: TransferEventValues) => ({
			from: event.from,
			to: event.to,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			amount: event.amount || event.value || '0'
		}),
		[]
	)

	// Helper function to ensure node exists
	const ensureNode = useCallback(
		(nodeMap: Map<string, TransactionNode>, address: string) => {
			if (!nodeMap.has(address)) {
				const isDeadAddress =
					address === '0x0000000000000000000000000000000000000000'
				const profile = isDeadAddress ? null : getProfile(address.toLowerCase())

				nodeMap.set(address, {
					id: address,
					name: isDeadAddress
						? '0x00...00'
						: profile?.name ?? truncateHex(address),
					imageUrl: isDeadAddress
						? '/icons/avatar.svg'
						: profile?.previewImageUrl ??
							profile?.imageUrl ??
							'/icons/avatar.svg',
					color: isDeadAddress
						? TRANSACTION_COLORS.DEAD_ADDRESS
						: TRANSACTION_COLORS.INTERMEDIATE,
					// eslint-disable-next-line @typescript-eslint/no-magic-numbers
					size: isDeadAddress ? 18 : 15,
					role: isDeadAddress ? 'burn' : 'intermediate'
				})
			}
		},
		[getProfile]
	)

	// Helper function to determine link color based on event type
	const getLinkColor = useCallback((eventType: string) => {
		if (eventType.includes('Transfer')) return TRANSACTION_COLORS.TRANSFER_LINK
		if (eventType.includes('Trust')) return TRANSACTION_COLORS.TRUST_EVENT_LINK
		if (eventType.includes('Mint')) return TRANSACTION_COLORS.MINT_EVENT_LINK
		return TRANSACTION_COLORS.TRANSFER_LINK
	}, [])

	// Process transaction data into graph format - EVENT DRIVEN
	const graphData = useMemo((): EnhancedGraphData => {
		if (!transactionData) {
			return { nodes: [], links: [] }
		}

		const nodeMap = new Map<string, TransactionNode>()
		const links: TransferLink[] = []

		// Sort ALL events chronologically
		const sortedEvents = transactionData.events
			.filter((event) => {
				// Include all events that have from/to fields
				const eventData = event as TransferEventValues
				return eventData.from && eventData.to
			})
			.sort((a, b) => (a.logIndex as number) - (b.logIndex as number))

		// Process each event to build nodes and links
		for (const event of sortedEvents) {
			const { from, to, amount } = extractEventFields(
				event as TransferEventValues
			)

			if (from && to) {
				// Create nodes for both addresses (including dead address)
				ensureNode(nodeMap, from)
				ensureNode(nodeMap, to)

				// Create link for this event
				links.push({
					source: from,
					target: to,
					value: TWO,
					color: getLinkColor(event.event),
					type: 'transfer',
					amount:
						amount === '0'
							? '0'
							: // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
								formatUnits(BigInt(amount), CRC_TOKEN_DECIMALS),
					animated: true,
					eventType: event.event
				})
			}
		}

		return {
			nodes: [...nodeMap.values()],
			links
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transactionData, extractEventFields, ensureNode, getLinkColor, profiles])

	// Create animated transfers from ALL events with from/to fields
	const createAnimatedTransfers = useCallback(() => {
		if (!transactionData) return []

		const transfers: AnimatedTransfer[] = []

		// Get ALL events with from/to fields sorted by log index for chronological order (REVERSED)
		const allEvents = transactionData.events
			.filter((event) => {
				const eventData = event as TransferEventValues
				return eventData.from && eventData.to
			})
			.sort((a, b) => (b.logIndex as number) - (a.logIndex as number))

		for (const [index, event] of allEvents.entries()) {
			const { from, to, amount } = extractEventFields(
				event as TransferEventValues
			)

			if (from && to) {
				const linkId = `${from}-${to}`

				transfers.push({
					id: `event-${index}`,
					linkId,
					position: 0, // Start at beginning of link
					transferData: {
						amount:
							amount === '0'
								? '0'
								: // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
									formatUnits(BigInt(amount), CRC_TOKEN_DECIMALS),
						eventType: event.event,
						from,
						to,
						timestamp: event.timestamp as number,
						logIndex: event.logIndex as number
					},
					isVisible: true
				})
			}
		}

		return transfers
	}, [transactionData, extractEventFields])

	// Initialize transfer queue
	useEffect(() => {
		const transfers = createAnimatedTransfers()
		setTransferQueue(transfers)
		setCurrentTransferIndex(0)
		// Initialize with only first transfer visible
		if (transfers.length > 0) {
			setAnimatedTransfers([{ ...transfers[0], isVisible: true }])
		} else {
			setAnimatedTransfers([])
		}
	}, [createAnimatedTransfers])

	// Animation position update loop (separated from completion logic)
	useEffect(() => {
		if (!isAnimationPlaying || transferQueue.length === 0) return () => {}

		const interval = setInterval(() => {
			setAnimatedTransfers((previous) =>
				previous.map((transfer) => ({
					...transfer,
					position: Math.min(
						transfer.position + TRANSITION_COEFICIENT * animationSpeed,
						ONE
					)
				}))
			)
		}, TRANSITION_DELAY) // 20 FPS

		return () => clearInterval(interval)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAnimationPlaying, animationSpeed])

	// Separate effect for completion detection with proper state management
	useEffect(() => {
		if (animatedTransfers.length > 0 && animatedTransfers[0]?.position >= ONE) {
			// Use functional update to avoid stale closure issues
			setCurrentTransferIndex((previousIndex) => {
				const nextIndex = previousIndex + ONE
				if (nextIndex < transferQueue.length) {
					// Immediately set the next transfer to avoid race conditions
					setTimeout(() => {
						setAnimatedTransfers([
							{
								...transferQueue[nextIndex],
								position: 0,
								isVisible: true
							}
						])
					}, 0)
					return nextIndex
				}
				// All transfers complete
				setIsAnimationPlaying(false)
				return previousIndex
			})
		}
	}, [animatedTransfers, transferQueue])

	// Effect to handle initial transfer setup when index changes
	useEffect(() => {
		if (
			transferQueue.length > 0 &&
			currentTransferIndex < transferQueue.length &&
			(animatedTransfers.length === 0 || animatedTransfers[0]?.position === 0)
		) {
			setAnimatedTransfers([
				{
					...transferQueue[currentTransferIndex],
					position: 0,
					isVisible: true
				}
			])
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentTransferIndex, transferQueue])

	// Animation controls
	const handlePlayPause = useCallback(() => {
		setIsAnimationPlaying((previous) => !previous)
	}, [])

	const handleReset = useCallback(() => {
		setIsAnimationPlaying(false)
		setCurrentTransferIndex(0)
		if (transferQueue.length > 0) {
			setAnimatedTransfers([
				{ ...transferQueue[0], position: 0, isVisible: true }
			])
		}
	}, [transferQueue])

	const handleStepForward = useCallback(() => {
		if (currentTransferIndex < transferQueue.length - ONE) {
			const nextIndex = currentTransferIndex + ONE
			setCurrentTransferIndex(nextIndex)
			setAnimatedTransfers([
				{ ...transferQueue[nextIndex], position: 0, isVisible: true }
			])
			setIsAnimationPlaying(false)
		}
	}, [currentTransferIndex, transferQueue])

	const handleStepBackward = useCallback(() => {
		if (currentTransferIndex > 0) {
			const previousIndex = currentTransferIndex - ONE
			setCurrentTransferIndex(previousIndex)
			setAnimatedTransfers([
				{ ...transferQueue[previousIndex], position: 0, isVisible: true }
			])
			setIsAnimationPlaying(false)
		}
	}, [currentTransferIndex, transferQueue])

	const handleSpeedChange = useCallback((speed: number) => {
		setAnimationSpeed(speed)
	}, [])

	return {
		graphData,
		animatedTransfers,
		isAnimationPlaying,
		animationSpeed,
		currentTransferIndex,
		transferQueue,
		handlePlayPause,
		handleReset,
		handleStepForward,
		handleStepBackward,
		handleSpeedChange,
		showTransferTooltips: true
	}
}
