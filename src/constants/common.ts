export const CIRCLES_INDEXER_URL = import.meta.env
	.VITE_CIRCLES_INDEXER_URL as string

// https://gnosisscan.io/
export const EXPLORER_URL = import.meta.env.VITE_EXPLORER_URL as string

export const CIRCLES_PROFILE_SERVICE_URL = import.meta.env
	.VITE_CIRCLES_PROFILE_SERVICE_URL as string

export const ENVIO_CIRCLES_ENDPOINT = import.meta.env
	.VITE_ENVIO_CIRCLES_ENDPOINT as string
export const ENVIO_API_TOKEN = import.meta.env.VITE_ENVIO_API_TOKEN as string

export const ONE = 1
export const TWO = 2
export const MINUS_ONE = -1

export const DEAD_ADDRESS = '0x0000000000000000000000000000000000000000'
export const CRC_TOKEN_ADDRESS = '0x208204e9797f09B540460013afbf5F6d8b5c9F98'
export const CRC_TOKEN_DECIMALS = 18
export const CRC_TOKEN_SYMBOL = 'CRC'
export const INDIVIDUAL_TOKEN_SYMBOL = 'RING'

// Constants for profile fetching
export const DEFAULT_BATCH_SIZE = 999
export const DEFAULT_IMAGE_BATCH_SIZE = 20
export const MIN_BATCH_SIZE = 1
export const DECIMAL_RADIX = 10

export const MIGRATION_CONTRACT = '0xD44B8dcFBaDfC78EA64c55B705BFc68199B56376'

// eslint-disable-next-line @typescript-eslint/no-loss-of-precision
export const CRC_MIGRATION_DENOMINATION = 2.216_690_071_905_145_5
