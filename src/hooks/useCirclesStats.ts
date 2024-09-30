import { useFetchCirclesStats } from 'services/circlesIndex'
import { useStatsStore } from 'stores/useStatsStore'

export const useCirclesStats = () => {
	useFetchCirclesStats()

	return useStatsStore((state) => state)
}
