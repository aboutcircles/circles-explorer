import { useBlockNumber } from 'services/viemClient'
import { useFilterStore } from 'stores/useFilterStore'
import { DEFAULT_BLOCK_RANGE } from 'constants/blockRange'

export const useStartBlock = () => {
	const startBlock = useFilterStore.use.startBlock()
	const blockNumber = useBlockNumber()

	const defaultStartBlock = Number(blockNumber) - DEFAULT_BLOCK_RANGE

	return {
		currentStartBlock: startBlock || defaultStartBlock,
		defaultStartBlock
	}
}
