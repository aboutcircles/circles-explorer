import type { UseQueryResult } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { http, createPublicClient, type Address, erc20Abi } from 'viem'
import { gnosis } from 'viem/chains'

import tokenAbi from 'abis/tokenAbi.json'
import logger from './logger'

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

// query
export const useCrcV1TokenStopped = (tokenAddress: Address): UseQueryResult =>
	useQuery({
		queryKey: ['crc_v1_token_stopped', tokenAddress],
		queryFn: async () => {
			try {
				return await getCrcV1TokenStopped(tokenAddress)
			} catch (error) {
				logger.error(
					'[service][viem] Failed to query crc v1 token stopped',
					error
				)
				throw new Error('Failed to query crc v1 token stopped')
			}
		},
		enabled: Boolean(tokenAddress)
	})
