import type { Hex, Address } from 'viem'
import type { AssetTypeIdentifier } from 'types/assetTypeIdentifier'

export interface Swap {
	readonly sellAssetId: AssetTypeIdentifier
	readonly buyAssetId: AssetTypeIdentifier
	readonly sellAmount: string
	readonly buyAmount: string
	readonly feeAmount: string
	readonly orderUid: `0x${string}`
}
export type SwapPending = Swap
export interface Transfer {
	readonly from: Address
	readonly to: Address
	readonly assetTypeId: AssetTypeIdentifier
	readonly amount: string
	readonly counterparty: Address
	readonly direction: string
	readonly demurrage?: string
}

export interface TransferPending extends Transfer {
	readonly comethRelayId: string | undefined
}

export interface Transaction {
	/**
	 * _id is our own internal identification of transactions right from the send flow.
	 */
	readonly _id: string
	readonly id?: string
	readonly hash?: string
	readonly blockNumber?: number
	readonly safeTxHash?: string
	readonly fee?: string
	readonly feeToken?: Address
	//
	readonly date: string
	readonly transfer?: Transfer | TransferPending
	readonly swap?: Swap
}
export interface TransferTransaction extends Transaction {
	readonly transfer: Transfer | TransferPending
}
export interface SwapTransaction extends Transaction {
	readonly swap: Swap
}

export interface SafeSwaps {
	readonly id: string
	readonly sellToken: Address
	readonly buyToken: Address
	readonly sellAmount: bigint
	readonly buyAmount: bigint
	readonly feeAmount: bigint
	readonly orderUid: string
	readonly owner: string
}

export interface SafeTransfer {
	readonly id: string
	readonly type: string
	readonly transferId: string
	readonly from: Address
	readonly to: Address
	readonly tokenAddress: Address
	readonly value: string
}

export interface SafeTransaction {
	readonly id: string
	readonly tokenAddress: Address
	readonly safeTxHash: string
	readonly transfers: SafeTransfer[]
	readonly swaps: SafeSwaps[]
	readonly executionDate: string
	readonly blockNumber: number
	readonly fee: string | undefined
	readonly feeToken: Address | undefined
}

enum TransferType {
	Erc20Wrapper,
	TransferSingle,
	TransferBatch,
	StreamCompleted,
	HubTransfer,
	Transfer
}

export interface Demurrage {
	readonly id: Address
	readonly value: string
	readonly from: Address
}

export interface CirclesTransfer {
	readonly id: Address
	readonly safeTxHash: Address
	readonly blockNumber: number
	readonly timestamp: number
	readonly transactionIndex: number
	readonly transactionHash: Address
	readonly logIndex: number
	readonly version: number
	readonly operator: Address
	readonly from: Address
	readonly to: Address
	readonly value: string
	readonly demurrageTo: Demurrage
	readonly demurrageFrom: Demurrage
	readonly transferType: TransferType
	readonly token: Address
}

export declare enum OperationType {
	Call = 0,
	DelegateCall = 1
}

export interface MetaTransaction {
	readonly to: string
	readonly value: string
	readonly data: string
	readonly operation?: OperationType
}

export interface MetaTransactionViem {
	readonly to: Hex
	readonly value: bigint
	readonly data: Hex
	readonly operation?: OperationType
}

export interface EnvioQueryResponse {
	Metri_Transaction: SafeTransaction[]
}

export interface CirclesEnvioQueryResponse {
	Transfer: CirclesTransfer[]
}
