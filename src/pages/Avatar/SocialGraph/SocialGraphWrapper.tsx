// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Address } from 'viem'

import { FilterCheckBox } from 'components/FilterCheckBox'
import { ONE, TWO } from 'constants/common'
import { MILLISECONDS_IN_A_SECOND } from 'constants/time'
import { useProfiles } from 'hooks/useProfiles'
import type {
	CirclesAvatarFromEnvio,
	TrustNetworkRelation
} from 'services/envio/indexer'
import { getTrustNetworkRelations } from 'services/envio/indexer'
import type { GraphData, ProfileNode, TrustLink } from 'types/graph'
import { truncateHex } from 'utils/eth'

import { SocialGraph } from './SocialGraph'

const CENTER_NODE_SIZE = 20 // Make center avatar larger
const NODE_SIZE = 15
const RELATED_NODE_SIZE = 12 // Size for nodes that are not directly connected to center

// Different colors for different circle layers
const COLORS = {
	CENTER: '#E91E63', // Center node (current avatar)
	FIRST_LAYER: {
		OUTGOING: '#2196F3', // First layer - outgoing trust
		INCOMING: '#4CAF50', // First layer - incoming trust
		MUTUAL: '#FF9800' // First layer - mutual trust
	},
	SECOND_LAYER: '#9C27B0', // Second layer nodes
	LINK: {
		OUTGOING: '#90CAF9', // Outgoing trust link
		INCOMING: '#A5D6A7', // Incoming trust link
		MUTUAL: '#FFB74D', // Mutual trust link
		INDIRECT: '#E1BEE7' // Link between non-center nodes
	}
}

interface SocialGraphWrapperProps {
	avatar: CirclesAvatarFromEnvio
}

export function SocialGraphWrapper({ avatar }: SocialGraphWrapperProps) {
	const graphReference = useRef<unknown>()
	const navigate = useNavigate()
	const { tab } = useParams<{ tab?: string }>()
	const containerRef = useRef<HTMLDivElement>(null)

	// State for graph data and UI controls
	const [graphData, setGraphData] = useState<GraphData>({
		nodes: [],
		links: []
	})
	const [highlightNodes, setHighlightNodes] = useState<Set<unknown>>(new Set())
	const [highlightLinks, setHighlightLinks] = useState<Set<unknown>>(new Set())
	const [containerWidth, setContainerWidth] = useState(600)
	const [isLoading, setIsLoading] = useState(false)
	const [networkRelations, setNetworkRelations] = useState<
		TrustNetworkRelation[]
	>([])

	// Filter controls
	const [showRecursive, setShowRecursive] = useState(false)
	const [showOnlyWithProfiles, setShowOnlyWithProfiles] = useState(true)

	// Handle toggle of recursive view to refresh graph completely
	const handleRecursiveToggle = (value: boolean) => {
		setShowRecursive(value)
		// Reset graph data to trigger a complete refresh when turning off recursive view
		if (!value) {
			setNetworkRelations([])
		}
	}

	const { getProfile } = useProfiles()

	// First fetch the network relations to build a more comprehensive graph
	useEffect(() => {
		const fetchNetworkRelations = async () => {
			setIsLoading(true)

			try {
				// Collect addresses for first-layer connections
				const directConnections: Address[] = []

				// Add addresses from trusts given
				for (const trust of avatar.trustsGiven) {
					if (trust.trustee_id !== avatar.id) {
						directConnections.push(trust.trustee_id)
					}
				}

				// Add addresses from trusts received
				for (const trust of avatar.trustsReceived) {
					if (trust.truster_id !== avatar.id) {
						directConnections.push(trust.truster_id)
					}
				}

				if (directConnections.length > 0) {
					const relations = await getTrustNetworkRelations(directConnections)
					setNetworkRelations(relations)
				} else {
					// Clear network relations if not showing recursive
					setNetworkRelations([])
				}
			} catch (error) {
				console.error('Error fetching network relations:', error)
			} finally {
				setIsLoading(false)
			}
		}

		// Only fetch network relations if showing recursive view
		if (avatar && showRecursive) {
			void fetchNetworkRelations()
		}
	}, [avatar, showRecursive])

	// Transform avatar trust data into graph data
	useEffect(() => {
		if (isLoading) return

		// Create the center node for the current avatar
		const centerNode: ProfileNode = {
			id: avatar.id,
			name: avatar.profile?.name ?? truncateHex(avatar.id),
			imageUrl:
				avatar.profile?.previewImageUrl ??
				avatar.profile?.imageUrl ??
				'/icons/avatar.svg',
			color: COLORS.CENTER,
			size: CENTER_NODE_SIZE
		}

		const nodes: ProfileNode[] = [centerNode]
		const links: TrustLink[] = []
		const processedIds = new Set([avatar.id])

		// Map to track the trust relationship type for first layer connections
		const firstLayerConnections = new Map<
			string,
			{ outgoing: boolean; incoming: boolean }
		>()

		// Process trusts given (outgoing from center)
		for (const trust of avatar.trustsGiven) {
			const trusteeId = trust.trustee_id

			// Skip self-trust
			if (trusteeId === avatar.id) continue

			const profile = getProfile(trusteeId.toLowerCase())

			// Skip nodes without profiles if filter is active
			if (showOnlyWithProfiles && !profile) continue

			// Track first layer connection - outgoing
			if (!firstLayerConnections.has(trusteeId)) {
				firstLayerConnections.set(trusteeId, {
					outgoing: true,
					incoming: false
				})
			} else {
				const connection = firstLayerConnections.get(trusteeId)
				connection.outgoing = true
				firstLayerConnections.set(trusteeId, connection)
			}

			if (!processedIds.has(trusteeId)) {
				processedIds.add(trusteeId)
				nodes.push({
					id: trusteeId,
					name: profile?.name ?? truncateHex(trusteeId),
					imageUrl:
						profile?.previewImageUrl ??
						profile?.imageUrl ??
						'/icons/avatar.svg',
					color: COLORS.FIRST_LAYER.OUTGOING,
					size: NODE_SIZE
				})
			}

			links.push({
				source: avatar.id,
				target: trusteeId,
				value: ONE,
				color: COLORS.LINK.OUTGOING
			})
		}

		// Process trusts received (incoming to center)
		for (const trust of avatar.trustsReceived) {
			const trusterId = trust.truster_id

			// Skip self-trust
			if (trusterId === avatar.id) continue

			const profile = getProfile(trusterId.toLowerCase())

			// Skip nodes without profiles if filter is active
			if (showOnlyWithProfiles && !profile) continue

			// Track first layer connection - incoming
			if (!firstLayerConnections.has(trusterId)) {
				firstLayerConnections.set(trusterId, {
					outgoing: false,
					incoming: true
				})
			} else {
				const connection = firstLayerConnections.get(trusterId)
				connection.incoming = true
				firstLayerConnections.set(trusterId, connection)
			}

			if (!processedIds.has(trusterId)) {
				processedIds.add(trusterId)
				nodes.push({
					id: trusterId,
					name: profile?.name ?? truncateHex(trusterId),
					imageUrl:
						profile?.previewImageUrl ??
						profile?.imageUrl ??
						'/icons/avatar.svg',
					color: COLORS.FIRST_LAYER.INCOMING,
					size: NODE_SIZE
				})
			}

			links.push({
				source: trusterId,
				target: avatar.id,
				value: ONE,
				color: COLORS.LINK.INCOMING
			})
		}

		// Update nodes with mutual connections and highlight them
		for (const [id, connection] of firstLayerConnections.entries()) {
			if (connection.outgoing && connection.incoming) {
				// This is a mutual trust connection
				const node = nodes.find((n) => n.id === id)
				if (node) {
					node.color = COLORS.FIRST_LAYER.MUTUAL
				}

				// Update link colors for mutual trust
				for (const link of links) {
					if (
						(link.source === avatar.id && link.target === id) ||
						(link.source === id && link.target === avatar.id)
					) {
						link.color = COLORS.LINK.MUTUAL
						link.value = TWO // Make mutual trust links thicker
					}
				}
			}
		}

		// Process network relations to build second layer connections
		if (networkRelations.length > 0) {
			const firstLayerIds = Array.from(firstLayerConnections.keys())

			for (const relation of networkRelations) {
				const sourceId = relation.truster_id
				const targetId = relation.trustee_id

				// Skip links that involve the center node (already processed)
				if (sourceId === avatar.id || targetId === avatar.id) continue

				// Skip nodes without profiles if filter is active
				const sourceProfile =
					getProfile(sourceId.toLowerCase()) || relation.truster.profile
				const targetProfile =
					getProfile(targetId.toLowerCase()) || relation.trustee?.profile

				if (showOnlyWithProfiles && (!sourceProfile || !targetProfile)) continue

				// We want to include relationships between first layer nodes
				// and relationships from first layer nodes to new nodes (second layer)
				if (
					(firstLayerIds.includes(sourceId) ||
						firstLayerIds.includes(targetId)) &&
					sourceId !== targetId // Skip self-trust
				) {
					// Add any new nodes (second layer)
					if (!processedIds.has(sourceId)) {
						processedIds.add(sourceId)
						const profile =
							getProfile(sourceId.toLowerCase()) || relation.truster.profile

						nodes.push({
							id: sourceId,
							name: profile?.name ?? truncateHex(sourceId),
							imageUrl: profile?.previewImageUrl ?? '/icons/avatar.svg',
							color: COLORS.SECOND_LAYER,
							size: RELATED_NODE_SIZE
						})
					}

					if (!processedIds.has(targetId)) {
						processedIds.add(targetId)
						const profile =
							getProfile(targetId.toLowerCase()) || relation.trustee?.profile

						nodes.push({
							id: targetId,
							name: profile?.name ?? truncateHex(targetId),
							imageUrl: profile?.previewImageUrl ?? '/icons/avatar.svg',
							color: COLORS.SECOND_LAYER,
							size: RELATED_NODE_SIZE
						})
					}

					// Add the link between these nodes
					links.push({
						source: sourceId,
						target: targetId,
						value: relation.isMutual ? TWO : ONE,
						color: relation.isMutual ? COLORS.LINK.MUTUAL : COLORS.LINK.INDIRECT
					})
				}
			}
		}

		setGraphData({ nodes, links })
	}, [avatar, getProfile, networkRelations, isLoading, showOnlyWithProfiles])

	// Center the graph on the main avatar with dynamic zoom level
	useEffect(() => {
		if (graphReference.current && graphData.nodes.length > 0) {
			setTimeout(() => {
				const zoomDuration = Math.min(400 + graphData.nodes.length * 10, 1000)

				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				graphReference.current.zoomToFit(zoomDuration, 1)
			}, MILLISECONDS_IN_A_SECOND / TWO)
		}
	}, [graphData])

	// Handle node hover - highlight connected nodes and links
	const handleNodeHover = useCallback(
		(node?: ProfileNode) => {
			if (!node) {
				setHighlightNodes(new Set())
				setHighlightLinks(new Set())
				return
			}

			// Get connected links and nodes
			const connectedLinks = graphData.links.filter(
				(link) =>
					link.source === node.id ||
					link.target === node.id ||
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					(link.source as unknown)?.id === node.id ||
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					(link.target as unknown)?.id === node.id
			)

			const connectedNodes = new Set<ProfileNode>()
			connectedNodes.add(node)

			for (const link of connectedLinks) {
				const sourceId =
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					typeof link.source === 'string' ? link.source : link.source.id
				const targetId =
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					typeof link.target === 'string' ? link.target : link.target.id

				const sourceNode = graphData.nodes.find((n) => n.id === sourceId)
				const targetNode = graphData.nodes.find((n) => n.id === targetId)

				if (sourceNode) connectedNodes.add(sourceNode)
				if (targetNode) connectedNodes.add(targetNode)
			}

			setHighlightLinks(new Set(connectedLinks))
			setHighlightNodes(connectedNodes)
		},
		[graphData]
	)

	// Handle node click - navigate to profile
	const handleNodeClick = useCallback(
		(node: ProfileNode) => {
			if (node.id !== avatar.id) {
				navigate(`/avatar/${node.id}/${tab ?? 'graph'}`)
			}
		},
		[avatar.id, navigate, tab]
	)

	useEffect(() => {
		if (containerRef.current) {
			setContainerWidth(containerRef.current.clientWidth)
		}

		const handleResize = () => {
			if (containerRef.current) {
				setContainerWidth(containerRef.current.clientWidth)
			}
		}

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	return (
		<div
			className='social-graph-container'
			style={{ height: '100%', width: '100%' }}
			ref={containerRef}
		>
			<div className='mb-3 flex justify-end gap-3 p-2'>
				<FilterCheckBox
					label='Show Circles'
					className='mr-2'
					isDefaultSelected={showRecursive}
					handleChange={handleRecursiveToggle}
				/>
				<FilterCheckBox
					label='Show Only With Profiles'
					className='mr-2'
					isDefaultSelected={showOnlyWithProfiles}
					handleChange={setShowOnlyWithProfiles}
				/>
			</div>
			<SocialGraph
				graphReference={graphReference}
				graphData={graphData}
				highlightNodes={highlightNodes}
				highlightLinks={highlightLinks}
				handleNodeHover={handleNodeHover}
				handleNodeClick={handleNodeClick}
				width={containerWidth}
			/>
		</div>
	)
}
