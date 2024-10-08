import { http, createPublicClient } from 'viem'
import { gnosis } from 'viem/chains'

export const viemClient = createPublicClient({
	chain: gnosis,
	transport: http()
})
