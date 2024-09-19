export type EventType = 'CrcV1_HubTransfer' | 'CrcV1_Transfer' | 'CrcV1_Trust'

export interface BaseEventValues {
	blockNumber: string
	logIndex: string
	timestamp: string
	transactionHash: string
	transactionIndex: string
}

export interface HubTransferEventValues {
	amount: string
	from: string
	to: string
}

export interface TransferEventValues extends HubTransferEventValues {
	tokenAddress: string
}

export interface TrustEventValues {
	canSendTo: string
	limit: string
	user: string
}

export interface EventResponse {
	event: EventType
	values: BaseEventValues &
		(HubTransferEventValues | TransferEventValues | TrustEventValues)
}

export interface CirclesEventsResponse {
	result: EventResponse[]
}

export type Event = EventResponse['values'] & Pick<EventResponse, 'event'>
