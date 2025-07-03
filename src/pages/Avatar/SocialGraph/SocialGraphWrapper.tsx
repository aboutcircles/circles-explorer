// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */

import { Chip } from '@nextui-org/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Address } from 'viem'

import { FilterCheckBox } from 'components/FilterCheckBox'
import { Loader } from 'components/Loader'
import { ONE, TWO } from 'constants/common'
import { MILLISECONDS_IN_A_SECOND } from 'constants/time'
import type { TrustNetworkRelation } from 'domains/trust/types'
import { useProfiles } from 'hooks/useProfiles'
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

export function SocialGraphWrapper({ avatar }: SocialGraphWrapperProperties) {
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
	const [isGeneratingImage, setIsGeneratingImage] = useState(false)

	// Handle toggle of recursive view to refresh graph completely
	const handleRecursiveToggle = (value: boolean) => {
		setShowRecursive(value)
		// Reset graph data to trigger a complete refresh when turning off recursive view
		if (!value) {
			setNetworkRelations([])
		}
	}

	const { getProfile, fetchProfiles } = useProfiles()

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
			} finally {
				setIsLoading(false)
			}
		}

		// Only fetch network relations if showing recursive view
		if (avatar && showRecursive) {
			void fetchNetworkRelations()
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

	// Social share handler
	const handleShareGraph = async () => {
		setIsGeneratingImage(true)

		try {
			// Find the canvas element specifically (react-force-graph-2d uses canvas)
			const canvasElement = containerReference.current?.querySelector('canvas')

			if (!canvasElement) {
				console.error('Canvas element not found')
				setIsGeneratingImage(false)
				return
			}

			// Create a new canvas with white background
			const originalCanvas = canvasElement as HTMLCanvasElement
			const newCanvas = document.createElement('canvas')
			const ctx = newCanvas.getContext('2d')

			if (!ctx) {
				setIsGeneratingImage(false)
				return
			}

			// Calculate square dimensions (crop to 1:1 ratio)
			const originalWidth = originalCanvas.width
			const originalHeight = originalCanvas.height
			const squareSize = Math.min(originalWidth, originalHeight)

			// Calculate crop offsets to center the crop
			const cropX = (originalWidth - squareSize) / 2
			const cropY = (originalHeight - squareSize) / 2

			// Set canvas to square size
			newCanvas.width = squareSize
			newCanvas.height = squareSize

			// Fill with white background
			ctx.fillStyle = '#ffffff'
			ctx.fillRect(0, 0, squareSize, squareSize)

			// Draw the cropped original canvas (centered square crop)
			ctx.drawImage(
				originalCanvas,
				cropX,
				cropY,
				squareSize,
				squareSize, // source crop area
				0,
				0,
				squareSize,
				squareSize // destination area
			)

			// Convert to blob
			const blob = await new Promise<Blob>((resolve, reject) => {
				newCanvas.toBlob(
					(result) => {
						if (result) {
							resolve(result)
						} else {
							reject(new Error('Failed to create blob'))
						}
					},
					'image/png',
					0.9
				)
			})

			// Download the image
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = 'my-trust-graph.png'
			a.style.display = 'none'
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)

			// Copy personalized share message to clipboard
			const currentUrl = window.location.href
			const shareMessage = `Hey, check out my Trust Graph on the Circles Explorer!

${currentUrl}

#CirclesUBI #TrustGraph`

			if (navigator.clipboard) {
				try {
					await navigator.clipboard.writeText(shareMessage)
					alert(
						'✅ Image downloaded!\n📋 Share message copied to clipboard!\n\nYou can now paste this message anywhere and attach the downloaded image.'
					)
				} catch {
					alert(
						`✅ Image downloaded!\n\n📝 Copy this message to share:\n"${shareMessage}"`
					)
				}
			} else {
				alert(
					`✅ Image downloaded!\n\n📝 Copy this message to share:\n"${shareMessage}"`
				)
			}
		} catch (error) {
			console.error('Error sharing graph:', error)
			alert('❌ Failed to generate image. Please try again.')
		} finally {
			setIsGeneratingImage(false)
		}
	}

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
				<Chip
					as='button'
					onClick={handleShareGraph}
					disabled={isGeneratingImage}
					variant='faded'
					classNames={{
						base: `border-default rounded-md h-[33px] my-1 cursor-pointer transition-colors ${
							isGeneratingImage
								? 'bg-gray-200 border-gray-300 cursor-not-allowed'
								: 'bg-gray-50 hover:bg-primary-100 hover:border-primary-200'
						}`,
						content: `${
							isGeneratingImage
								? 'text-gray-400'
								: 'text-gray-300 hover:text-primary-400 font-medium'
						}`
					}}
					aria-label='Share Trust Graph'
				>
					{isGeneratingImage ? 'Generating...' : 'Share'}
				</Chip>
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
