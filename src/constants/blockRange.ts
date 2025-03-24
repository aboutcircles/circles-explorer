// Constants for block range management
// * 7
// try 0: 7000 blocks (~10 hours)
// try 1: 49000 blocks (~2.8 days)
// try 2: 343000 blocks (~19.8 days)
// try 3: 2401000 blocks (~4.6 months)
// try 4: 16807000 blocks (~2.7 years)

export const DEFAULT_BLOCK_RANGE = 7200 // Initial range size
export const MAX_BLOCK_RANGE = 20_000_000 // Maximum range size

// Constants for recursive fetching
export const MAX_RETRY_COUNT = 5
export const RANGE_MULTIPLIER = 7 // Base for exponential growth
export const RETRY_INCREMENT = 1 // Increment for retry count
