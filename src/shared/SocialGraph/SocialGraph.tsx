// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */

import * as d3 from 'd3-force'
import { useCallback, useEffect, useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

import type { GraphData, ProfileNode } from 'types/graph'
import type { AnimatedTransfer } from './types'

const NODE_SIZE = 15
const FONT_SIZE = 12
const DOT_SIZE = 4

interface SocialGraphProps {
	graphReference: React.RefObject<unknown>
	graphData: GraphData
	highlightNodes: Set<unknown>
	highlightLinks: Set<unknown>
	handleNodeHover: (node?: ProfileNode) => void
	handleNodeClick: (node: ProfileNode) => void
	width: number
	// NEW: Animation props
	animatedTransfers?: AnimatedTransfer[]
	isAnimationPlaying?: boolean
	onTransferClick?: (transfer: AnimatedTransfer) => void
	showTransferTooltips?: boolean
	height?: number
	zoom: number
}

export function SocialGraph({
	graphReference,
	graphData,
	highlightNodes,
	highlightLinks,
	handleNodeHover,
	handleNodeClick,
	width,
	animatedTransfers = [],
	isAnimationPlaying = false,
	onTransferClick,
	showTransferTooltips = false,
	height = 800,
	zoom
}: SocialGraphProps) {
	// Set initial zoom level to 5x after graph loads
	useEffect(() => {
		if (graphReference.current && graphData.nodes.length > 0) {
			// Wait for the graph to initialize, then set zoom
			const timer = setTimeout(() => {
				if (graphReference.current && graphReference.current.zoom) {
					graphReference.current.zoom(zoom, 1000) // 5x zoom with 1000ms transition
				}
			}, 1000) // Wait 1.5 seconds for graph to stabilize

			return () => clearTimeout(timer)
		}
	}, [graphData.nodes.length, graphReference])

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

	// Helper function to calculate position along a link
	const getPositionOnLink = useCallback(
		(start: any, end: any, position: number) => {
			return {
				x: start.x + (end.x - start.x) * position,
				y: start.y + (end.y - start.y) * position
			}
		},
		[]
	)

	// Custom link rendering with varying opacity and width + animated dots
	const linkCanvasObject = useCallback(
		(link: any, context: any, globalScale: number) => {
			const start = link.source
			const end = link.target

			// Determine if this link should be highlighted
			const isHighlighted = highlightLinks.has(link)

			// Draw the static link with appropriate styling
			context.beginPath()
			context.moveTo(start.x, start.y)
			context.lineTo(end.x, end.y)
			context.strokeStyle = link.color || '#999'
			context.lineWidth =
				((link.value || 1) / globalScale) * (isHighlighted ? 2 : 1)
			context.globalAlpha = isHighlighted ? 1 : 0.6
			context.stroke()
			context.globalAlpha = 1

			// Draw animated transfer dots if any exist for this link
			if (animatedTransfers && animatedTransfers.length > 0) {
				const linkId = `${typeof start === 'string' ? start : start.id}-${typeof end === 'string' ? end : end.id}`
				const transfersForLink = animatedTransfers.filter(
					(transfer) => transfer.linkId === linkId && transfer.isVisible
				)

				for (const transfer of transfersForLink) {
					const dotPosition = getPositionOnLink(start, end, transfer.position)

					// Draw animated dot
					context.beginPath()
					context.arc(
						dotPosition.x,
						dotPosition.y,
						DOT_SIZE / globalScale,
						0,
						2 * Math.PI
					)

					// Color based on transfer type
					const dotColor =
						transfer.transferData.eventType === 'CrcV1_Transfer' ||
						transfer.transferData.eventType === 'CrcV2_Transfer'
							? '#4CAF50'
							: '#FF9800'

					context.fillStyle = dotColor
					context.fill()

					// Add white border for visibility
					context.strokeStyle = 'white'
					context.lineWidth = 1 / globalScale
					context.stroke()

					// Show tooltip moving with dot when enabled
					if (showTransferTooltips) {
						const fontSize = 10 / globalScale
						context.font = `${fontSize}px Sans-Serif`
						context.textAlign = 'center'
						context.textBaseline = 'bottom'

						// Tooltip background
						const tooltipText = `${transfer.transferData.amount} CRC`
						const textWidth = context.measureText(tooltipText).width
						const tooltipX = dotPosition.x
						const tooltipY = dotPosition.y - DOT_SIZE / globalScale - 5

						context.fillStyle = 'rgba(0, 0, 0, 0.8)'
						context.fillRect(
							tooltipX - textWidth / 2 - 4,
							tooltipY - fontSize - 2,
							textWidth + 8,
							fontSize + 4
						)

						// Tooltip text
						context.fillStyle = 'white'
						context.fillText(tooltipText, tooltipX, tooltipY)
					}
				}
			}
		},
		[
			highlightLinks,
			animatedTransfers,
			getPositionOnLink,
			showTransferTooltips,
			isAnimationPlaying
		]
	)

	// Handle D3 force simulation with dynamic parameters based on network size
	const handleD3Force = useCallback(
		(d3Force: any) => {
			try {
				// Scale charge strength based on node count
				const nodeCount = graphData.nodes.length
				const chargeStrength = Math.min(
					-140 * Math.max(1, nodeCount / 10),
					-600
				)

				// Scale link distance based on node count
				const baseLinkDistance = Math.max(180, 120 + nodeCount * 6)

				if (d3Force('charge')) d3Force('charge').strength(chargeStrength)

				// Configure link forces for a more circular layout
				if (d3Force('link')) {
					d3Force('link')
						.distance((link: any) => {
							// Adjust distance based on link value and network density
							const baseDistance = link.value
								? baseLinkDistance / link.value
								: baseLinkDistance

							// Find nodes for this link
							const sourceNode = graphData.nodes.find(
								(n) =>
									n.id ===
									(typeof link.source === 'string'
										? link.source
										: link.source.id)
							)
							const targetNode = graphData.nodes.find(
								(n) =>
									n.id ===
									(typeof link.target === 'string'
										? link.target
										: link.target.id)
							)

							// If one node is the center node, make distance shorter to create circle structure
							if (
								(sourceNode && sourceNode.size === 20) || // Center node has size 20
								(targetNode && targetNode.size === 20)
							) {
								return baseDistance * 0.8 // Shorter distance for center connections
							}

							// If nodes are mutual, pull them a bit closer
							if (link.color === '#FFB74D') {
								// Mutual link color
								return baseDistance * 0.9
							}

							return baseDistance
						})
						.strength((link: any) => {
							// Stronger force for mutual links and center connections
							// to emphasize the circle structure around the center node
							if (link.value > 1) return 0.2
							return 0.1
						})
				}

				// Center force pulls nodes toward the middle
				if (d3Force('center')) {
					d3Force('center')
						.strength(0.05) // Increased from 0.03 for more circular structure
						.x(width / 2)
						.y(400) // Fixed position for better visualization
				}

				// Add radial force to organize nodes in circular layers
				if (!d3Force('radial')) {
					// Create circle layers based on node types
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					d3Force.force(
						'radial',
						d3
							.forceRadial((node: any) => {
								// Center node
								if (node.size === 20) return 0

								// First layer nodes
								if (node.size === 15) return 180

								// Second layer nodes
								return 320
							})
							.strength(0.3)
							.x(width / 2)
							.y(400)
					)
				}

				// Add collision force to prevent node overlap
				if (!d3Force('collision')) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					d3Force.force(
						'collision',
						d3
							.forceCollide()
							.radius((node: any) => {
								return (node.size || NODE_SIZE) * 1.2 // Larger collision area
							})
							.strength(1) // Full collision strength
					)
				}
			} catch (error) {
				console.error('Error configuring d3 forces:', error)
			}
		},
		[graphData, width]
	)

	// Optimization: memoize the graph component configuration
	const graphConfig = useMemo(
		() => ({
			nodeRelSize: 12, // Increased from 6 for better visibility
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
			warmupTicks: 50, // Increased from 20 for better initial layout
			cooldownTicks: 100, // Increased from 50 for more stable layout
			cooldownTime: 2000,
			onNodeClick: handleNodeClick,
			onNodeHover: handleNodeHover,
			nodeCanvasObject,
			linkCanvasObject,
			// Enable GPU acceleration for better performance
			nodeCanvasObjectMode: () => 'replace',
			linkCanvasObjectMode: () => 'replace',
			// Increase node hit area for better clickability
			nodePointerAreaPaint: (
				node: any,
				color: string,
				ctx: any,
				globalScale: number
			) => {
				ctx.fillStyle = color
				const size = (node.size || NODE_SIZE) + 10 // Larger hit area
				ctx.beginPath()
				ctx.arc(node.x, node.y, size / globalScale, 0, 2 * Math.PI)
				ctx.fill()
			}
		}),
		[handleNodeClick, handleNodeHover, nodeCanvasObject, linkCanvasObject]
	)

	return (
		<ForceGraph2D
			height={height}
			width={width}
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			ref={graphReference}
			graphData={graphData}
			{...graphConfig}
			// Additional performance optimizations
			cooldownTime={3000}
			d3Force={handleD3Force}
		/>
	)
}
