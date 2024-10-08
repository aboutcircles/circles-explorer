import { useState, useEffect } from 'react'
import { viemClient } from 'services/viemClient'

export const useBlockNumber = () => {
	const [blockNumber, setBlockNumber] = useState<number | null>(null)

	useEffect(() => {
		const fetchBlockNumber = async () => {
			const result = await viemClient.getBlockNumber()
			setBlockNumber(Number(result))
		}

		void fetchBlockNumber()
	}, [])

	return blockNumber
}
