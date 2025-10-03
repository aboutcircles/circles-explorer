import type { GraphData, ProfileNode, TrustLink } from 'types/graph'

// Extended types for animated graphs
export interface AnimatedTransfer {
	id: string
	linkId: string
	position: number // 0-1 along the path
	transferData: {
		amount: string
		eventType: string
		from: string
		to: string
		timestamp: number
		logIndex: number
	}
	isVisible: boolean
}

export interface TransferLink extends TrustLink {
	type: 'transfer' | 'trust'
	amount?: string
	animated?: boolean
	direction?: 'in' | 'out'
	eventType?: string
}

export interface TransactionNode extends ProfileNode {
	role?: 'burn' | 'intermediate' | 'receiver' | 'sender'
	totalSent?: string
	totalReceived?: string
}

export interface EnhancedGraphData extends GraphData {
	nodes: (ProfileNode | TransactionNode)[]
	links: (TransferLink | TrustLink)[]
}

export interface GraphConfig {
	type: 'avatar' | 'transaction'
	showTrustRelations: boolean
	showTransfers: boolean
	animateTransfers?: boolean
}

export interface AvatarGraphConfig extends GraphConfig {
	type: 'avatar'
	centerAddress: string
	showRecursive: boolean
}

export interface TransactionGraphConfig extends GraphConfig {
	type: 'transaction'
	transactionHash: string
	participants: string[]
}
