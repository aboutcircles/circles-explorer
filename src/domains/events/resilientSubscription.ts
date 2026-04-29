import type { CirclesEvent, Observable } from '@aboutcircles/sdk-rpc'
import type { Address } from 'viem'

import { circlesRpcV2 } from 'services/circlesData'
import logger from 'services/logger'

const HEALTH_CHECK_INTERVAL_MS = 5000

interface ResilientSubscription {
	subscribe: (handler: (event: CirclesEvent) => void) => () => void
}

// Polls the SDK's private websocketConnected flag because @aboutcircles/sdk-rpc
// does not expose a reconnect event. The SDK reconnects internally on close,
// but never re-issues circles_subscribe — so the server forgets about the
// subscription and live updates silently die. This wrapper detects the
// disconnect→reconnect transition and re-subscribes, keeping the same
// downstream handler. The cache layer in watchEventUpdates already dedupes
// by event key, so any transient overlap between old and new subscriptions
// is absorbed there.
const isClientConnected = (): boolean =>
	Boolean(
		(circlesRpcV2.client as unknown as { websocketConnected?: boolean })
			.websocketConnected
	)

export const subscribeWithResubscribe = async (
	address?: Address
): Promise<ResilientSubscription> => {
	const initialObservable = (await circlesRpcV2.client.subscribe(
		address
	)) as Observable<CirclesEvent>

	return {
		subscribe(handler) {
			let currentUnsubscribe: (() => void) | null =
				initialObservable.subscribe(handler)
			let stopped = false
			let lastConnected = isClientConnected()

			const pollTimer = setInterval(() => {
				if (stopped) return

				const connected = isClientConnected()

				if (lastConnected && !connected) {
					lastConnected = false
					logger.warn(
						'[Repository] WebSocket disconnected, awaiting reconnect'
					)
					return
				}

				if (!lastConnected && connected) {
					lastConnected = true
					logger.log(
						'[Repository] WebSocket reconnected, re-issuing circles_subscribe'
					)
					currentUnsubscribe?.()
					currentUnsubscribe = null
					circlesRpcV2.client
						.subscribe(address)
						.then((next) => {
							if (stopped) return
							currentUnsubscribe = (
								next as Observable<CirclesEvent>
							).subscribe(handler)
						})
						.catch((error) => {
							logger.error(
								'[Repository] Failed to re-subscribe after reconnect',
								error
							)
						})
				}
			}, HEALTH_CHECK_INTERVAL_MS)

			return () => {
				stopped = true
				clearInterval(pollTimer)
				currentUnsubscribe?.()
			}
		}
	}
}
