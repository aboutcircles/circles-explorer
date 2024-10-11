import { type Address, erc20Abi } from 'viem'
import { useReadContracts } from 'wagmi'

interface UseTokenBalanceProperties {
	tokenAddress: Address
}

export const useTokenDetails = ({
	tokenAddress
}: UseTokenBalanceProperties) => {
	const { data: [decimals, symbol] = [], ...tokenRest } = useReadContracts({
		allowFailure: false,
		contracts: [
			{
				address: tokenAddress,
				abi: erc20Abi,
				functionName: 'decimals'
			},
			{
				address: tokenAddress,
				abi: erc20Abi,
				functionName: 'symbol'
			}
		].filter(Boolean),
		query: {
			enabled: Boolean(tokenAddress)
		}
	})

	return {
		decimals,
		symbol,
		...tokenRest
	}
}
