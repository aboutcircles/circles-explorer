import type { Address } from 'viem'

/**
 * Represents a Circles token with detailed information
 */
export interface Token {
	address: Address
	owner: Address
	totalSupply: string
	type: string
	version: number
	isStopped: boolean
	timestamp: number
}

/**
 * Represents token balance information
 */
export interface TokenBalance {
	tokenAddress: Address
	ownerAddress: Address
	balance: string
	circles: number // Formatted balance in Circles
	timestamp: number
}

/**
 * Represents token migration status
 */
export interface TokenMigration {
	tokenAddress: Address
	migrationAmount: number
	migrationPercentage: number // Percentage of total supply that has been migrated
}

/**
 * Represents a single holder of a CRC V2 token
 */
export interface TokenHolder {
	account: Address
	tokenId: Address
	tokenAddress: Address
	lastActivity: number
	totalBalance: string
	demurragedTotalBalance: string
	circlesDemurraged: number
	circlesTotal: number
	sharePercent?: number
}
