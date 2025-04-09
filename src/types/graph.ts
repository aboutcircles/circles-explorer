export interface ProfileNode {
	id: string
	name: string
	imageUrl: string
	color?: string
	size?: number
}

export interface TrustLink {
	source: string
	target: string
	value?: number // Trust strength
	color?: string
}

export interface GraphData {
	nodes: ProfileNode[]
	links: TrustLink[]
}
