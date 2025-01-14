import { http, createPublicClient, type Address, erc20Abi } from 'viem'
import { gnosis } from 'viem/chains'

import tokenAbi from 'abis/tokenAbi.json'

export const viemClient = createPublicClient({
	chain: gnosis,
	transport: http()
})

export const getTokenDetails = async (tokenAddress: Address) => {
	const [decimals, symbol] = await Promise.all([
		viemClient.readContract({
			address: tokenAddress,
			abi: erc20Abi,
			functionName: 'decimals'
		}),
		viemClient.readContract({
			address: tokenAddress,
			abi: erc20Abi,
			functionName: 'symbol'
		})
	])

	return {
		decimals,
		symbol
	}
}

export const getCrcV1TokenStopped = async (tokenAddress: Address) =>
	viemClient.readContract({
		address: tokenAddress,
		abi: tokenAbi,
		functionName: 'stopped'
	})
