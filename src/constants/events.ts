import type { CirclesEventType } from '@circles-sdk/data'

export const V1_EVENTS: CirclesEventType[] = [
	'CrcV1_HubTransfer',
	'CrcV1_Transfer',
	'CrcV1_Trust',
	'CrcV1_OrganizationSignup',
	'CrcV1_Signup',
	'CrcV1_TransferSummary',
	'CrcV1_UpdateMetadataDigest'
]

export const BASE_GROUP_EVENTS: CirclesEventType[] = [
	'CrcV2_BaseGroupCreated',
	'CrcV2_BaseGroupOwnerUpdated',
	'CrcV2_BaseGroupServiceUpdated',
	'CrcV2_BaseGroupFeeCollectionUpdated'
]

export const V2_EVENTS: CirclesEventType[] = [
	'CrcV2_ApprovalForAll',
	'CrcV2_CidV0',
	'CrcV2_CreateVault',
	'CrcV2_DepositDemurraged',
	'CrcV2_DepositInflationary',
	'CrcV2_ERC20WrapperDeployed',
	'CrcV2_Erc20WrapperTransfer',
	// 'CrcV2_GroupMintBatch',
	// 'CrcV2_GroupMintSingle',
	'CrcV2_GroupRedeem',
	'CrcV2_GroupRedeemCollateralBurn',
	'CrcV2_GroupRedeemCollateralReturn',
	'CrcV2_PersonalMint',
	'CrcV2_RegisterGroup',
	'CrcV2_RegisterHuman',
	'CrcV2_RegisterOrganization',
	'CrcV2_RegisterShortName',
	'CrcV2_Stopped',
	'CrcV2_StreamCompleted',
	'CrcV2_TransferBatch',
	'CrcV2_TransferSingle',
	'CrcV2_Trust',
	'CrcV2_UpdateMetadataDigest',
	'CrcV2_URI',
	'CrcV2_WithdrawDemurraged',
	'CrcV2_WithdrawInflationary',
	'CrcV2_InviteHuman',
	'CrcV2_DiscountCost',
	'CrcV2_CollateralLockedSingle',
	'CrcV2_CollateralLockedBatch',
	'CrcV2_TransferSummary',
	'CrcV2_FlowEdgesScopeLastEnded',
	'CrcV2_FlowEdgesScopeSingleStarted',

	...BASE_GROUP_EVENTS
]

export const SAFE_EVENTS: CirclesEventType[] = [
	'Safe_AddedOwner',
	'Safe_ProxyCreation',
	'Safe_RemovedOwner',
	'Safe_SafeSetup'
]

export const UNKNOWN_EVENTS: CirclesEventType[] = ['Crc_UnknownEvent']

export const EVENTS = [
	...V1_EVENTS,
	...V2_EVENTS,
	...SAFE_EVENTS,
	...UNKNOWN_EVENTS
]

export const LABELS_MAPPER: Record<CirclesEventType, string> = {
	CrcV1_HubTransfer: 'Hub Transfer',
	CrcV1_Transfer: 'Transfer',
	CrcV1_Trust: 'Trust',
	CrcV1_OrganizationSignup: 'Organization Signup',
	CrcV1_Signup: 'Signup',
	CrcV1_TransferSummary: 'Transfer Summary',
	CrcV1_UpdateMetadataDigest: 'Update Metadata Digest',

	CrcV2_ApprovalForAll: 'Approval For All',
	CrcV2_CidV0: 'Cid V0',
	CrcV2_CreateVault: 'Create Vault',
	CrcV2_DepositDemurraged: 'Deposit Demurraged',
	CrcV2_DepositInflationary: 'Deposit Inflationary',
	CrcV2_ERC20WrapperDeployed: 'ERC20 Wrapper Deployed',
	CrcV2_Erc20WrapperTransfer: 'ERC20 Wrapper Transfer',
	// 'CrcV2_GroupMintBatch': 'Group Mint Batch',
	// 'CrcV2_GroupMintSingle': 'Group Mint Single',
	CrcV2_GroupRedeem: 'Group Redeem',
	CrcV2_GroupRedeemCollateralBurn: 'Group Redeem Collateral Burn',
	CrcV2_GroupRedeemCollateralReturn: 'Group Redeem Collateral Return',
	CrcV2_PersonalMint: 'Personal Mint',
	CrcV2_RegisterGroup: 'Register Group',
	CrcV2_RegisterHuman: 'Register Human',
	CrcV2_RegisterOrganization: 'Register Organization',
	CrcV2_RegisterShortName: 'Register Short Name',
	CrcV2_Stopped: 'Stopped',
	CrcV2_StreamCompleted: 'Stream Completed',
	CrcV2_TransferBatch: 'Transfer Batch',
	CrcV2_TransferSingle: 'Transfer Single',
	CrcV2_Trust: 'Trust',
	CrcV2_UpdateMetadataDigest: 'Update Metadata Digest',
	CrcV2_URI: 'URI',
	CrcV2_WithdrawDemurraged: 'Withdraw Demurraged',
	CrcV2_WithdrawInflationary: 'Withdraw Inflationary',
	CrcV2_InviteHuman: 'Invite Human',
	CrcV2_DiscountCost: 'Discount Cost',
	CrcV2_CollateralLockedSingle: 'Collateral Locked Single',
	CrcV2_CollateralLockedBatch: 'Collateral Locked Batch',
	CrcV2_TransferSummary: 'Transfer Summary',
	CrcV2_FlowEdgesScopeLastEnded: 'Flow Edges Scope Last Ended',
	CrcV2_FlowEdgesScopeSingleStarted: 'Flow Edges Scope Single Started',

	CrcV2_BaseGroupCreated: 'Base Group Created',
	CrcV2_BaseGroupOwnerUpdated: 'Base Group Owner Updated',
	CrcV2_BaseGroupServiceUpdated: 'Base Group Service Updated',
	CrcV2_BaseGroupFeeCollectionUpdated: 'Base Group Fee Collection Updated',

	Safe_AddedOwner: 'Safe Added Owner',
	Safe_ProxyCreation: 'Safe Proxy Creation',
	Safe_RemovedOwner: 'Safe Removed Owner',
	Safe_SafeSetup: 'Safe Setup',

	Crc_UnknownEvent: 'Unknown Event'
}
