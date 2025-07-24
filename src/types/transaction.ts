import type { Event } from './events'

export interface TransactionMetadata {
	hash: string
	status: 'failed' | 'success'
	blockNumber: number
	blockHash: string
	transactionIndex: number
	from: string
	to: string | null
	value: string
	gasUsed: string
	gasLimit: string
	gasPrice: string
	nonce: number
	timestamp: number
}

export interface TransactionParticipant {
	address: string
	role: 'intermediate' | 'receiver' | 'sender'
	amount?: string
	tokenAddress?: string
}

export interface TransactionData {
	metadata: TransactionMetadata
	events: Event[]
	participants: TransactionParticipant[]
}
