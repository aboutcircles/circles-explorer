import type { TokenInfoRow } from '@circles-sdk/data/dist/rows/tokenInfoRow'
import type { Address } from 'viem'
import { formatUnits } from 'viem'

import {
	CRC_MIGRATION_DENOMINATION,
	CRC_TOKEN_DECIMALS,
	TWO
} from 'constants/common'
import { formatTokenUnits } from 'utils/number'
import type { Token, TokenBalance } from './types'

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
export const formatTokenMigrationAmount = (migrationAmount: number): string =>
	(formatTokenUnits(migrationAmount) * CRC_MIGRATION_DENOMINATION).toFixed(TWO)
