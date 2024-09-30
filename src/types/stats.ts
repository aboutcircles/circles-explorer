export type MeasureName =
	| 'avatar_count_v1'
	| 'avatar_count_v2'
	| 'circles_transfer_count_v1'
	| 'circles_transfer_count_v2'
	| 'erc20_wrapper_token_count_v2'
	| 'group_count_v2'
	| 'human_count_v1'
	| 'human_count_v2'
	| 'organization_count_v1'
	| 'organization_count_v2'
	| 'token_count_v1'
	| 'token_count_v2'
	| 'transitive_transfer_count_v1'
	| 'transitive_transfer_count_v2'
	| 'trust_count_v1'
	| 'trust_count_v2'

export type Measure = [MeasureName, string]

export interface StatsResult {
	columns: ['measure', 'value']
	rows: Measure[]
}

export interface StatsResponse {
	result: StatsResult
}
