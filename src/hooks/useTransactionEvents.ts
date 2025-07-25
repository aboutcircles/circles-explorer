import { useMemo } from 'react'
import { isAddress } from 'viem'

import { avatarFields } from 'constants/avatarFields'
import { DEAD_ADDRESS } from 'constants/common'
import { useEventsCoordinator } from 'coordinators/eventsCoordinator'
import type { Event } from 'types/events'
import type { TransactionData, TransactionParticipant } from 'types/transaction'

/**
 * Hook to get all events and participants for a specific transaction
 */
export const useTransactionEvents = (txHash: string) => {
	// Get events filtered by transaction hash (server-side filtering)
	const { events, isEventsLoading } = useEventsCoordinator(null, txHash)

	// Extract participants and metadata from transaction events
	const transactionData = useMemo((): TransactionData | null => {
		if (!txHash || events.length === 0) return null

		// Events are already filtered by transaction hash from server
		const transactionEvents = events

		if (transactionEvents.length === 0) return null

		// Extract unique participants from all events
		const participantAddresses = new Set<string>()
		const participantRoles = new Map<string, Set<string>>()

		for (const event of transactionEvents) {
			// Check all avatar fields for addresses
			for (const field of avatarFields) {
				const address = event[field as keyof Event] as string
				if (address && isAddress(address) && address !== DEAD_ADDRESS) {
					participantAddresses.add(address)

					// Determine role based on field name
					if (!participantRoles.has(address)) {
						participantRoles.set(address, new Set())
					}

					const roles = participantRoles.get(address)
					if (roles) {
						if (
							field === 'from' ||
							field === 'truster' ||
							field === 'inviter'
						) {
							roles.add('sender')
						} else if (
							field === 'to' ||
							field === 'trustee' ||
							field === 'invited'
						) {
							roles.add('receiver')
						} else {
							roles.add('intermediate')
						}
					}
				}
			}
		}

		// Convert to participants array
		const participants: TransactionParticipant[] = [
			...participantAddresses
		].map((address) => {
			const roles = participantRoles.get(address)
			// Prioritize roles: sender > receiver > intermediate
			const primaryRole = roles?.has('sender')
				? 'sender'
				: roles?.has('receiver')
					? 'receiver'
					: 'intermediate'

			return {
				address,
				role: primaryRole
			}
		})

		// Get the first event for basic transaction metadata
		const [firstEvent] = transactionEvents

		// Safely extract properties that might not exist on all event types
		const getEventProperty = (event: Event, property: string): string =>
			((event as unknown as Record<string, unknown>)[property] as string) || ''

		return {
			metadata: {
				hash: txHash,
				status: 'success' as const, // We'll enhance this later with actual transaction data
				blockNumber: firstEvent.blockNumber as number,
				blockHash: '', // We'll fetch this later
				transactionIndex: firstEvent.transactionIndex as number,
				from: getEventProperty(firstEvent, 'from'),
				to: getEventProperty(firstEvent, 'to') || null,
				value:
					getEventProperty(firstEvent, 'amount') ||
					getEventProperty(firstEvent, 'value') ||
					'0',
				gasUsed: '0', // We'll fetch this later
				gasLimit: '0', // We'll fetch this later
				gasPrice: '0', // We'll fetch this later
				nonce: 0, // We'll fetch this later
				timestamp: firstEvent.timestamp as number
			},
			events: transactionEvents,
			participants
		}
	}, [txHash, events])

	return {
		transactionData,
		isLoading: isEventsLoading
	}
}
