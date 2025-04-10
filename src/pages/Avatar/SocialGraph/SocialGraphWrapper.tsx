// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ONE, TWO } from 'constants/common'
import { MILLISECONDS_IN_A_SECOND } from 'constants/time'
import { useProfiles } from 'hooks/useProfiles'
import type { CirclesAvatarFromEnvio } from 'services/envio/indexer'
import type { GraphData, ProfileNode, TrustLink } from 'types/graph'
import { truncateHex } from 'utils/eth'

import { SocialGraph } from './SocialGraph'

const CENTER_NODE_SIZE = 20 // Make center avatar larger
const NODE_SIZE = 15

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
