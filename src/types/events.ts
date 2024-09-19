export type EventType =
	| 'CrcV1_HubTransfer'
	| 'CrcV1_OrganizationSignup'
	| 'CrcV1_Signup'
	| 'CrcV1_Transfer'
	| 'CrcV1_Trust'
	| 'CrcV2_ApprovalForAll'
	| 'CrcV2_CidV0'
	| 'CrcV2_CreateVault'
	| 'CrcV2_DepositDemurraged'
	| 'CrcV2_DepositInflationary'
	| 'CrcV2_Erc20WrapperDeployed'
	| 'CrcV2_Erc20WrapperTransfer'
	| 'CrcV2_GroupMintBatch'
	| 'CrcV2_GroupMintSingle'
	| 'CrcV2_GroupRedeem'
	| 'CrcV2_GroupRedeemCollateralBurn'
	| 'CrcV2_GroupRedeemCollateralReturn'
	| 'CrcV2_PersonalMint'
	| 'CrcV2_RegisterGroup'
	| 'CrcV2_RegisterHuman'
	| 'CrcV2_RegisterOrganization'
	| 'CrcV2_RegisterShortName'
	| 'CrcV2_Stopped'
	| 'CrcV2_StreamCompleted'
	| 'CrcV2_TransferBatch'
	| 'CrcV2_TransferSingle'
	| 'CrcV2_Trust'
	| 'CrcV2_UpdateMetadataDigest'
	| 'CrcV2_URI'
	| 'CrcV2_WithdrawDemurraged'
	| 'CrcV2_WithdrawInflationary'

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
