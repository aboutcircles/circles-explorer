// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */

import * as d3 from 'd3-force'
import { useCallback, useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

import type { GraphData, ProfileNode } from 'types/graph'

const NODE_SIZE = 15
const FONT_SIZE = 12

interface SocialGraphProps {
	graphReference: React.RefObject<unknown>
	graphData: GraphData
	highlightNodes: Set<unknown>
	highlightLinks: Set<unknown>
	handleNodeHover: (node?: ProfileNode) => void
	handleNodeClick: (node: ProfileNode) => void
	width: number
}

export function SocialGraph({
	graphReference,
	graphData,
	highlightNodes,
	highlightLinks,
	handleNodeHover,
	handleNodeClick,
	width
}: SocialGraphProps) {
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

	// Handle D3 force simulation with dynamic parameters based on network size
	const handleD3Force = useCallback(
		(d3Force: any) => {
			try {
				// Scale charge strength based on node count
				const nodeCount = graphData.nodes.length
				const chargeStrength = Math.min(
					-120 * Math.max(1, nodeCount / 10),
					-500
				)

				// Scale link distance based on node count
				const baseLinkDistance = Math.max(150, 100 + nodeCount * 5)

				if (d3Force('charge')) d3Force('charge').strength(chargeStrength)
				if (d3Force('link'))
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
					d3Force('link').distance((link: unknown) => {
						// Adjust distance based on link value and network density
						const baseDistance = link.value
							? baseLinkDistance / link.value
							: baseLinkDistance
						return baseDistance
					})
				if (d3Force('center')) d3Force('center').strength(0.03)

				// Add collision force to prevent node overlap
				if (!d3Force('collision')) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					d3Force.force(
						'collision',
						d3.forceCollide().radius((node: any) => {
							return (node.size || NODE_SIZE) / 2 + 10
						})
					)
				}
			} catch (error) {
				console.error('Error configuring d3 forces:', error)
			}
		},
		[graphData]
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
			height={800}
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
