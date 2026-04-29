import { CirclesRpc as CirclesRpcV2 } from '@aboutcircles/sdk-rpc'

import { CIRCLES_INDEXER_URL } from 'constants/common'

// GA-aware RPC client (@aboutcircles/sdk-rpc). All runtime data fetching goes
// through this. The explorer's CirclesEventType union lives in src/types/events.ts
// because the new SDK's union doesn't yet cover all event types the indexer emits.
export const circlesRpcV2 = new CirclesRpcV2(CIRCLES_INDEXER_URL)
