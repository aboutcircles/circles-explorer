import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { EventsTable } from 'shared/EventsTable'
import { Filter } from 'shared/Filter'
import { circlesData, circlesProfiles } from 'services/circlesData'

export default function Avatar() {
	const { address } = useParams()
	useEffect(() => {
		const loadAvatarInfo = async (address_: string) => {
			console.log({ address_ })

			// const profile = await sdk_.profiles?.get(avatarInfo.cidV0)

			// console.log({ profile })

			// console.log(avatar.current.avatarInfo)
			//
			const [
				avatarInfo,
				totalBalance,
				totalBalanceV2,
				tokenBalances,
				txHistory,
				trustRelations
				// aggregatedTrustRelations
			] = await Promise.all([
				circlesData.getAvatarInfo(address_),
				circlesData.getTotalBalance(address_),
				circlesData.getTotalBalanceV2(address_),
				circlesData.getTokenBalances(address_),
				// eslint-disable-next-line @typescript-eslint/no-magic-numbers
				circlesData.getTransactionHistory(address_, 50),
				// eslint-disable-next-line @typescript-eslint/no-magic-numbers
				circlesData.getTrustRelations(address_, 50)
				// circlesData.getAggregatedTrustRelations(address_)
			])

			console.log({
				avatarInfo,
				totalBalance,
				totalBalanceV2,
				tokenBalances,
				txHistory,
				trustRelations
				// aggregatedTrustRelations
			})

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			const profile = await circlesProfiles.get(avatarInfo.cidV0)
			//
			console.log({ profile })
		}

		if (address) {
			void loadAvatarInfo(address)
		}
	}, [address])

	return (
		<div>
			<h1>Hello</h1>
			<h1>{address}</h1>

			<Filter />
			<EventsTable address={address} />
		</div>
	)
}
