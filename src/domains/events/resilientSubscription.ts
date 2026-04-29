import type { CirclesEvent, Observable } from '@aboutcircles/sdk-rpc'
import type { Address } from 'viem'

import { circlesRpcV2 } from 'services/circlesData'
import logger from 'services/logger'

const HEALTH_CHECK_INTERVAL_MS = 5000

interface ResilientSubscription {
	subscribe: (handler: (event: CirclesEvent) => void) => () => void
}

// @aboutcircles/sdk-rpc does not expose a reconnect event or a documented
// connection-status API. The SDK reconnects internally on close, but never
// re-issues circles_subscribe — so the server forgets the subscription and
// live updates silently die. We poll the SDK's internal websocketConnected
// flag as a best-effort signal and combine it with try/catch around every
// subscribe call so failures (initial or post-reconnect) are retried on
// the next poll tick. Cache deduplication in watchEventUpdates absorbs any
// transient overlap between old and new subscriptions.
const isClientConnected = (): boolean =>
	Boolean(
		(circlesRpcV2.client as unknown as { websocketConnected?: boolean })
			.websocketConnected
	)

export const subscribeWithResubscribe = async (
	address?: Address
): Promise<ResilientSubscription> => {
	let initialObservable: Observable<CirclesEvent> | null = null
	try {
		initialObservable = (await circlesRpcV2.client.subscribe(
			address
		)) as Observable<CirclesEvent>
	} catch (error) {
		logger.error(
			'[Repository] Initial WebSocket subscribe failed; will retry via poll loop',
			error
		)
	}

	return {
		subscribe(handler) {
			let currentUnsubscribe: (() => void) | null =
				initialObservable?.subscribe(handler) ?? null
			let stopped = false
			// Start "connected" only if the initial subscribe actually landed.
			// If it failed, lastConnected = false so the first poll tick that
			// sees the socket up will trigger a fresh subscribe.
			let lastConnected = currentUnsubscribe !== null
			let resubscribePending = false

			const trySubscribe = (reason: string) => {
				if (stopped || resubscribePending) return
				resubscribePending = true
				currentUnsubscribe?.()
				currentUnsubscribe = null
				circlesRpcV2.client
					.subscribe(address)
					.then((next) => {
						resubscribePending = false
						if (stopped) return
						currentUnsubscribe = (
							next as Observable<CirclesEvent>
						).subscribe(handler)
						lastConnected = true
						logger.log(
							`[Repository] WebSocket subscribed (${reason})`
						)
					})
					.catch((error) => {
						resubscribePending = false
						// Reset lastConnected so the next poll tick that sees a
						// connected socket attempts another subscribe.
						lastConnected = false
						logger.error(
							`[Repository] Subscribe failed (${reason}); will retry on next poll tick`,
							error
						)
					})
			}

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
					trySubscribe('reconnect')
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
