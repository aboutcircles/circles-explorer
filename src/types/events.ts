/**
 * Explorer-owned union of every Circles event type the indexer can emit.
 *
 * This used to be imported from `@circles-sdk/data`. After the migration to
 * `@aboutcircles/sdk-rpc` the old SDK is no longer used at runtime — but the
 * new SDK's `CirclesEventType` union is incomplete (missing all V1 events,
 * the `*_TransferSummary` synthetic events the Nethermind plugin emits, the
 * `Safe_*` events, several CMGroup/CirclesBacking/BaseGroup types, etc.).
 *
 * Owning the union here decouples the explorer from upstream SDK type drift
 * and lets us add new event types as the indexer ships them.
 *
 * Keep this list a strict superset of what the indexer actually emits — any
 * mismatch surfaces as `Crc_UnknownEvent`.
 */
export type CirclesEventType =
	// V1 (legacy Hub) — still present in historical avatar data
	| 'CrcV1_HubTransfer'
	| 'CrcV1_OrganizationSignup'
	| 'CrcV1_Signup'
	| 'CrcV1_Transfer'
	| 'CrcV1_TransferSummary'
	| 'CrcV1_Trust'
	| 'CrcV1_UpdateMetadataDigest'
	// V2 — registration / metadata
	| 'CrcV2_CidV0'
	| 'CrcV2_RegisterGroup'
	| 'CrcV2_RegisterHuman'
	| 'CrcV2_RegisterOrganization'
	| 'CrcV2_RegisterShortName'
	| 'CrcV2_UpdateMetadataDigest'
	// V2 — invitations / minting / status
	| 'CrcV2_InviteHuman'
	| 'CrcV2_PersonalMint'
	| 'CrcV2_SetAdvancedUsageFlag'
	| 'CrcV2_Stopped'
	// V2 — trust
	| 'CrcV2_Trust'
	// V2 — transfers (ERC1155 + ERC20 wrappers)
	| 'CrcV2_Approval'
	| 'CrcV2_ApprovalForAll'
	| 'CrcV2_DiscountCost'
	| 'CrcV2_EIP712DomainChanged'
	| 'CrcV2_Erc20WrapperTransfer'
	| 'CrcV2_ERC20WrapperDeployed'
	| 'CrcV2_StreamCompleted'
	| 'CrcV2_Transfer'
	| 'CrcV2_TransferBatch'
	| 'CrcV2_TransferSingle'
	| 'CrcV2_TransferSummary'
	| 'CrcV2_URI'
	// V2 — wrappers (deposit/withdraw between demurraged and inflationary)
	| 'CrcV2_DepositDemurraged'
	| 'CrcV2_DepositInflationary'
	| 'CrcV2_WithdrawDemurraged'
	| 'CrcV2_WithdrawInflationary'
	// V2 — group internals
	| 'CrcV2_CollateralLockedBatch'
	| 'CrcV2_CollateralLockedSingle'
	| 'CrcV2_CreateVault'
	| 'CrcV2_GroupMint'
	| 'CrcV2_GroupRedeem'
	| 'CrcV2_GroupRedeemCollateralBurn'
	| 'CrcV2_GroupRedeemCollateralReturn'
	// V2 — pathfinder flow scopes
	| 'CrcV2_FlowEdgesScopeLastEnded'
	| 'CrcV2_FlowEdgesScopeSingleStarted'
	// V2 — CMGroup
	| 'CrcV2_CMGroupCreated'
	// V2 — Backing
	| 'CrcV2_CirclesBackingCompleted'
	| 'CrcV2_CirclesBackingDeployed'
	| 'CrcV2_CirclesBackingInitiated'
	| 'CrcV2_LBPDeployed'
	// V2 — BaseGroup
	| 'CrcV2_BaseGroupCreated'
	| 'CrcV2_BaseGroupFeeCollectionUpdated'
	| 'CrcV2_BaseGroupOwnerUpdated'
	| 'CrcV2_BaseGroupServiceUpdated'
	// Safe wallet events
	| 'Safe_AddedOwner'
	| 'Safe_ProxyCreation'
	| 'Safe_RemovedOwner'
	| 'Safe_SafeSetup'
	// Catch-all for anything the indexer ships before this union is updated
	| 'Crc_UnknownEvent'

export interface BaseEventValues {
	blockNumber: number | string
	logIndex: number | string
	timestamp: number | string
	transactionHash: string
	transactionIndex: number | string
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
	event: CirclesEventType
	values: BaseEventValues &
		(HubTransferEventValues | TransferEventValues | TrustEventValues)
}

export interface CirclesEventsResponse {
	result: { events: EventResponse[] }
}

export type Event = EventResponse['values'] &
	Pick<EventResponse, 'event'> & {
		key: string
	}

export type ProcessedEvent = Event & {
	isExpandable: boolean
	subEvents: Event[]
}
