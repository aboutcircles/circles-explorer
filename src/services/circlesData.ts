import { CirclesData, CirclesRpc } from '@circles-sdk/data'

import { CIRCLES_INDEXER_URL } from 'constants/common'

const circlesRpc = new CirclesRpc(CIRCLES_INDEXER_URL)

export const circlesData = new CirclesData(circlesRpc)
