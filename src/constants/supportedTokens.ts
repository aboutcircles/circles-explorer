import type { Address } from 'viem'

export interface SupportedToken {
	symbol: string
	decimals: number
	name: string
	icon: string
}

// Token decimal constants
const USDC_DECIMALS = 6

// Supported tokens for CirclesBackingDeployed transfer details
// Only USDC, USDT, and DAI on Gnosis Chain
export const SUPPORTED_TOKENS: Record<Address, SupportedToken> = {
	// USDC on Gnosis Chain
	'0x2a22f9c3b484c3629090feed35f17ff8f88f76f0': {
		symbol: 'USDC',
		decimals: USDC_DECIMALS,
		name: 'USD Coin',
		icon: '/icons/tokens/usdc.svg'
	}
}

export const isSupportedToken = (address: string): boolean => {
	const supportedAddresses = Object.keys(SUPPORTED_TOKENS).map((key) =>
		key.toLowerCase()
	)
	return supportedAddresses.includes(address.toLowerCase())
}

export const getSupportedToken = (address: string): SupportedToken | null => {
	const normalizedAddress = address as Address
	return SUPPORTED_TOKENS[normalizedAddress] ?? null
}
