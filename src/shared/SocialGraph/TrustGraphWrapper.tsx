// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Address } from 'viem'

import { FilterCheckBox } from 'components/FilterCheckBox'
import { GoToTopButton } from 'components/GoToTopButton'
import { Loader } from 'components/Loader'
import { ONE, TWO } from 'constants/common'
import { MILLISECONDS_IN_A_SECOND } from 'constants/time'
import { useProfilesCoordinator } from 'coordinators'
import type { TrustNetworkRelation } from 'domains/trust/types'
import { type CirclesAvatarFromEnvio } from 'services/envio/indexer'
import { TrustSearchBox } from 'shared/Search/TrustSearchBox'
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

interface SocialGraphWrapperProperties {
	avatar: CirclesAvatarFromEnvio
}

export function TrustGraphWrapper({ avatar }: SocialGraphWrapperProperties) {
	const graphReference = useRef<unknown>()
	const navigate = useNavigate()
	const { tab } = useParams<{ tab?: string }>()
	const containerReference = useRef<HTMLDivElement>(null)

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
	const [searchTerm, setSearchTerm] = useState('')

	// Handle toggle of recursive view to refresh graph completely
	const handleRecursiveToggle = (value: boolean) => {
		setShowRecursive(value)
		// Reset graph data to trigger a complete refresh when turning off recursive view
		if (!value) {
			setNetworkRelations([])
		}
	}

	const { getProfile, fetchProfiles } = useProfilesCoordinator()

	// Handle graph export as PNG image
	const handleExportGraph = useCallback(() => {
		if (graphReference.current) {
			try {
				// Get the canvas element from the ForceGraph2D component
				// Try different ways to access the canvas
				let canvas = null

				// Method 1: Try renderer().domElement
				if (graphReference.current.renderer) {
					canvas = graphReference.current.renderer().domElement
				}

				// Method 2: Try accessing canvas directly
				if (!canvas && graphReference.current.canvas) {
					canvas = graphReference.current.canvas()
				}

				// Method 3: Try finding canvas in the DOM
				if (!canvas) {
					const graphContainer = document.querySelector(
						'.social-graph-container'
					)
					if (graphContainer) {
						canvas = graphContainer.querySelector('canvas')
					}
				}

				if (canvas) {
					// Create download link
					const link = document.createElement('a')
					link.download = `trust-graph-${truncateHex(avatar.id)}-${Date.now()}.png`
					link.href = canvas.toDataURL('image/png', 1.0) // High quality PNG
					document.body.appendChild(link)
					link.click()
					document.body.removeChild(link)
				} else {
					console.error('Could not find canvas element for export')
				}
			} catch (error) {
				console.error('Error exporting graph:', error)
				// Fallback: try to use browser print
				window.print()
			}
		}
	}, [avatar.id])

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
					// Import and use our repository-based function
					const { getRepositoryTrustNetworkRelations } = await import(
						'domains/trust/networkRelations'
					)
					const relations =
						await getRepositoryTrustNetworkRelations(directConnections)
					setNetworkRelations(relations)
				} else {
					// Clear network relations if not showing recursive
					setNetworkRelations([])
				}
			} catch (error) {
				console.error('Error fetching network relations:', error)
				setNetworkRelations([])
			} finally {
				setIsLoading(false)
			}
		}

		if (!avatar) return

		// Fetch network relations if showing recursive view, otherwise clear them
		if (showRecursive) {
			void fetchNetworkRelations()
		} else {
			// Clear network relations immediately when turning off recursive view
			setNetworkRelations([])
		}
	}, [avatar, showRecursive])

	// Filter nodes based on search term
	const filterNodes = useCallback(
		(nodes: ProfileNode[]) => {
			if (!searchTerm.trim()) return nodes

			const term = searchTerm.toLowerCase()
			return nodes.filter((node) => {
				const address = node.id.toLowerCase()
				const name = node.name.toLowerCase()

				return (
					address.includes(term) ||
					name.includes(term) ||
					address === avatar.id.toLowerCase()
				)
			})
		},
		[searchTerm]
	)

	// Transform avatar trust data into graph data
	useEffect(() => {
		if (isLoading) return

		const profile = getProfile(avatar.id.toLowerCase())

		// Create the center node for the current avatar
		const centerNode: ProfileNode = {
			id: avatar.id,
			name: profile?.name ?? truncateHex(avatar.id),
			imageUrl:
				profile?.previewImageUrl ?? profile?.imageUrl ?? '/icons/avatar.svg',
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
			if (firstLayerConnections.has(trusteeId)) {
				const connection = firstLayerConnections.get(trusteeId)
				connection.outgoing = true
				firstLayerConnections.set(trusteeId, connection)
			} else {
				firstLayerConnections.set(trusteeId, {
					outgoing: true,
					incoming: false
				})
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
			if (firstLayerConnections.has(trusterId)) {
				const connection = firstLayerConnections.get(trusterId)
				connection.incoming = true
				firstLayerConnections.set(trusterId, connection)
			} else {
				firstLayerConnections.set(trusterId, {
					outgoing: false,
					incoming: true
				})
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
			const firstLayerIds = new Set(firstLayerConnections.keys())

			for (const relation of networkRelations) {
				const sourceId = relation.truster_id
				const targetId = relation.trustee_id

				// Skip links that involve the center node (already processed)
				if (sourceId === avatar.id || targetId === avatar.id) continue

				// Skip nodes without profiles if filter is active
				const sourceProfile =
					getProfile(sourceId.toLowerCase()) || relation.truster.profile
				const targetProfile =
					getProfile(targetId.toLowerCase()) || relation.trustee.profile

				if (showOnlyWithProfiles && (!sourceProfile || !targetProfile)) continue

				// We want to include relationships between first layer nodes
				// and relationships from first layer nodes to new nodes (second layer)
				if (
					(firstLayerIds.has(sourceId) || firstLayerIds.has(targetId)) &&
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
							getProfile(targetId.toLowerCase()) || relation.trustee.profile

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

		// Filter nodes based on search term
		const filteredNodes = filterNodes(nodes)
		const nodeIds = new Set(filteredNodes.map((n) => n.id))

		// Keep only links between filtered nodes
		const filteredLinks = links.filter((link) => {
			const sourceId =
				typeof link.source === 'string' ? link.source : link.source.id
			const targetId =
				typeof link.target === 'string' ? link.target : link.target.id
			return nodeIds.has(sourceId) && nodeIds.has(targetId)
		})

		setGraphData({ nodes: filteredNodes, links: filteredLinks })
	}, [
		avatar,
		getProfile,
		networkRelations,
		isLoading,
		showOnlyWithProfiles,
		filterNodes
	])

	// Center the graph on the main avatar with dynamic zoom level
	useEffect(() => {
		if (graphReference.current && graphData.nodes.length > 0) {
			setTimeout(() => {
				const zoomDuration = Math.min(400 + graphData.nodes.length * 10, 1000)

				if (graphReference.current) {
					graphReference.current.zoomToFit(zoomDuration, 1)
				}
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

	if (isLoading) {
		return <Loader />
	}

	return (
		<div
			className='social-graph-container'
			style={{ height: '100%', width: '100%' }}
			ref={containerReference}
		>
			<div className='mb-3 flex flex-wrap justify-center gap-3 p-2'>
				<TrustSearchBox
					onSearch={setSearchTerm}
					placeholder='Search nodes by name or address'
					className='w-full md:w-[320px]'
				/>
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
				<FilterCheckBox
					label='Export Graph'
					className='mr-2'
					isDefaultSelected={true}
					handleChange={handleExportGraph}
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
			{/* Go to top button for easier navigation when graph is full screen */}
			<GoToTopButton className='' threshold={200} />
		</div>
	)
}
