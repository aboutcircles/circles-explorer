import type { TokenInfoRow } from '@circles-sdk/data/dist/rows/tokenInfoRow'
import { CRC_TOKEN_DECIMALS } from 'constants/common'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
import type { Token, TokenBalance, TokenMigration } from './types'

/**
 * Adapts a token from the SDK format to our domain model
 */
export const adaptTokenFromSdk = (
	sdkToken: TokenInfoRow,
	totalSupply = '0',
	isStopped = false
): Token => ({
	address: sdkToken.token,
	owner: sdkToken.tokenOwner,
	totalSupply,
	type: sdkToken.type,
	version: sdkToken.version,
	isStopped,
	timestamp: sdkToken.timestamp
})

/**
 * Creates a token balance object
 * This doesn't directly adapt from SDK since the TokenBalanceRow structure is unclear
 */
export const createTokenBalance = (
	tokenAddress: Address,
	ownerAddress: Address,
	balance: string,
	timestamp: number = Date.now()
): TokenBalance => ({
	tokenAddress,
	ownerAddress,
	balance,
	circles: Number(formatUnits(BigInt(balance || '0'), CRC_TOKEN_DECIMALS)),
	timestamp
})

/**
 * Creates a token migration object
 */
export const createTokenMigration = (
	tokenAddress: Address,
	migrationAmount: number,
	totalSupply: string
): TokenMigration => {
	const totalSupplyNumber = Number(
		formatUnits(BigInt(totalSupply), CRC_TOKEN_DECIMALS)
	)
	const migrationAmountNumber = Number(
		formatUnits(BigInt(migrationAmount.toString()), CRC_TOKEN_DECIMALS)
	)

	// Use constant for percentage calculation to avoid magic number
	const PERCENTAGE_MULTIPLIER = 100
	const migrationPercentage =
		totalSupplyNumber > 0
			? (migrationAmountNumber / totalSupplyNumber) * PERCENTAGE_MULTIPLIER
			: 0

	return {
		tokenAddress,
		migrationAmount,
		migrationPercentage
	}
}
