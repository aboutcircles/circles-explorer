// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */

import { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { useNavigate, useParams } from 'react-router-dom'

import { useProfiles } from 'hooks/useProfiles'
import type { CirclesAvatarFromEnvio } from 'services/envio/indexer'
import type { GraphData, ProfileNode, TrustLink } from 'types/graph'
import { truncateHex } from 'utils/eth'
import { ONE, TWO } from 'constants/common'
import { MILLISECONDS_IN_A_SECOND } from 'constants/time'

const CENTER_NODE_SIZE = 20 // Make center avatar larger
const NODE_SIZE = 15
const FONT_SIZE = 12

interface SocialGraphProperties {
	avatar: CirclesAvatarFromEnvio
}

export default function SocialGraph({ avatar }: SocialGraphProperties) {
	const graphReference = useRef<unknown>()
	const navigate = useNavigate()
	const { tab } = useParams<{ tab?: string }>()

	// State for graph data and UI controls
	const [graphData, setGraphData] = useState<GraphData>({
		nodes: [],
		links: []
	})
	const [highlightNodes, setHighlightNodes] = useState<Set<unknown>>(new Set())
	const [highlightLinks, setHighlightLinks] = useState<Set<unknown>>(new Set())

	const { getProfile } = useProfiles()

	// Transform avatar trust data into graph data
	useEffect(() => {
		// Create the center node for the current avatar
		const centerNode: ProfileNode = {
			id: avatar.id,
			name: avatar.profile?.name ?? truncateHex(avatar.id),
			imageUrl:
				avatar.profile?.previewImageUrl ??
				avatar.profile?.imageUrl ??
				'/icons/avatar.svg',
			color: '#E91E63', // Highlight the center avatar
			size: CENTER_NODE_SIZE
		}

		const nodes: ProfileNode[] = [centerNode]
		const links: TrustLink[] = []
		const processedIds = new Set([avatar.id])

		// Process trusts given
		for (const trust of avatar.trustsGiven) {
			const trusteeId = trust.trustee_id
			const profile = getProfile(trusteeId.toLowerCase())

			if (!processedIds.has(trusteeId)) {
				processedIds.add(trusteeId)
				nodes.push({
					id: trusteeId,
					name: profile?.name ?? truncateHex(trusteeId),
					imageUrl:
						profile?.previewImageUrl ??
						profile?.imageUrl ??
						'/icons/avatar.svg',
					color: '#2196F3',
					size: NODE_SIZE
				})
			}

			links.push({
				source: avatar.id,
				target: trusteeId,
				value: ONE,
				color: '#90CAF9'
			})
		}

		// Process trusts received
		for (const trust of avatar.trustsReceived) {
			const trusterId = trust.truster_id
			const profile = getProfile(trusterId.toLowerCase())

			if (!processedIds.has(trusterId)) {
				processedIds.add(trusterId)
				nodes.push({
					id: trusterId,
					name: profile?.name ?? truncateHex(trusterId),
					imageUrl:
						profile?.previewImageUrl ??
						profile?.imageUrl ??
						'/icons/avatar.svg',
					color: '#4CAF50',
					size: NODE_SIZE
				})
			}

			links.push({
				source: trusterId,
				target: avatar.id,
				value: ONE,
				color: '#A5D6A7'
			})
		}

		// Add connections between nodes when they trust each other (both directions)
		const trustsGivenSet = new Set(avatar.trustsGiven.map((t) => t.trustee_id))
		const trustsReceivedSet = new Set(
			avatar.trustsReceived.map((t) => t.truster_id)
		)

		const mutualTrusts = [...trustsGivenSet].filter((id) =>
			trustsReceivedSet.has(id)
		)

		for (const mutualId of mutualTrusts) {
			// Find existing links and update their style to show mutual trust
			for (const link of links) {
				if (
					(link.source === avatar.id && link.target === mutualId) ||
					(link.source === mutualId && link.target === avatar.id)
				) {
					link.color = '#FF9800' // Highlight mutual trust with a different color
					link.value = TWO // Make mutual trust links thicker
				}
			}
		}

		setGraphData({ nodes, links })
	}, [avatar, getProfile])

	// Center the graph on the main avatar
	useEffect(() => {
		if (graphReference.current && graphData.nodes.length > 0) {
			setTimeout(() => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				// eslint-disable-next-line @typescript-eslint/no-magic-numbers
				graphReference.current.zoomToFit(400, 50)
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

	// Custom node rendering with profile images
	const nodeCanvasObject = useCallback(
		(node: ProfileNode, context: unknown, globalScale: number) => {
			// Node base styling
			const size = node.size ?? NODE_SIZE
			const fontSize = FONT_SIZE / globalScale
			const isHighlighted = highlightNodes.has(node)
			const label = node.name

			// Draw node circle
			context.beginPath()
			context.arc(node.x, node.y, size / globalScale, 0, 2 * Math.PI)
			context.fillStyle = isHighlighted ? '#FF5252' : node.color || '#1976D2'
			context.fill()
			context.strokeStyle = 'white'
			context.lineWidth = 1.5 / globalScale
			context.stroke()

			// Load and draw profile image
			const img = new Image()
			img.src = node.imageUrl

			// Use a circular clipping path for the image
			if (img.complete) {
				context.save()
				context.beginPath()
				context.arc(node.x, node.y, (size - 2) / globalScale, 0, 2 * Math.PI)
				context.clip()
				context.drawImage(
					img,
					node.x - size / globalScale,
					node.y - size / globalScale,
					(size * 2) / globalScale,
					(size * 2) / globalScale
				)
				context.restore()
			}

			// Draw node label below the node
			context.font = `${fontSize}px Sans-Serif`
			context.textAlign = 'center'
			context.textBaseline = 'middle'
			context.fillStyle = 'black'

			// Add a background behind text for readability
			const textWidth = context.measureText(label).width
			context.fillStyle = 'rgba(255, 255, 255, 0.8)'
			context.fillRect(
				node.x - textWidth / 2 - 2,
				node.y + size / globalScale + 2,
				textWidth + 4,
				fontSize + 4
			)

			context.fillStyle = '#333'
			context.fillText(
				label,
				node.x,
				node.y + size / globalScale + fontSize / 2 + 4
			)
		},
		[highlightNodes]
	)

	// Custom link rendering with varying opacity and width
	const linkCanvasObject = useCallback(
		(link: any, context: any, globalScale: number) => {
			const start = link.source
			const end = link.target

			// Determine if this link should be highlighted
			const isHighlighted = highlightLinks.has(link)

			// Draw the link with appropriate styling
			context.beginPath()
			context.moveTo(start.x, start.y)
			context.lineTo(end.x, end.y)
			context.strokeStyle = link.color || '#999'
			context.lineWidth =
				((link.value || 1) / globalScale) * (isHighlighted ? 2 : 1)
			context.globalAlpha = isHighlighted ? 1 : 0.6
			context.stroke()
			context.globalAlpha = 1
		},
		[highlightLinks]
	)

	// Optimization: memoize the graph component configuration
	const graphConfig = useMemo(
		() => ({
			nodeRelSize: 6,
			nodeId: 'id',
			nodeVal: 'size',
			nodeColor: 'color',
			nodeLabel: 'name',
			linkSource: 'source',
			linkTarget: 'target',
			linkColor: 'color',
			linkWidth: (link: any) => link.value || 1,
			d3AlphaDecay: 0.02,
			d3VelocityDecay: 0.3,
			warmupTicks: 20,
			cooldownTicks: 50,
			cooldownTime: 2000,
			onNodeClick: handleNodeClick,
			onNodeHover: handleNodeHover,
			nodeCanvasObject,
			linkCanvasObject,
			// Enable GPU acceleration for better performance
			nodeCanvasObjectMode: () => 'replace',
			linkCanvasObjectMode: () => 'replace'
		}),
		[handleNodeClick, handleNodeHover, nodeCanvasObject, linkCanvasObject]
	)

	// Handle errors with D3 force simulation
	const handleD3Force = useCallback((d3Force: any) => {
		try {
			if (d3Force('charge')) d3Force('charge').strength(-120)
			if (d3Force('link'))
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				d3Force('link').distance((link: unknown) =>
					link.value ? 100 / link.value : 100
				)
			if (d3Force('center')) d3Force('center').strength(0.05)
		} catch (error) {
			console.error('Error configuring d3 forces:', error)
		}
	}, [])

	return (
		<div
			className='social-graph-container'
			// style={{ height: '50vh', width: '100%' }}
		>
			<ForceGraph2D
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				ref={graphReference}
				graphData={graphData}
				{...graphConfig}
				// Additional performance optimizations
				cooldownTime={3000}
				d3Force={handleD3Force}
			/>
		</div>
	)
}
