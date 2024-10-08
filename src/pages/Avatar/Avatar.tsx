import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { EventsTable } from 'shared/EventsTable'
import { Filter } from 'shared/Filter'
import { circlesData } from 'services/circlesData'

export default function Avatar() {
	const { address } = useParams()
	useEffect(() => {
		const loadAvatarInfo = async (address_: string) => {
			console.log({ address_ })
			const avatarInfo = await circlesData.getAvatarInfo(address_)

			console.log({ avatarInfo })

			// const profile = await sdk_.profiles?.get(avatarInfo.cidV0)

			// console.log({ profile })

			// console.log(avatar.current.avatarInfo)
			//
			// const [balance, mintAmount, trustRels, txnHistory] = await Promise.all([
			// 	avatar.current.getTotalBalance(),
			// 	avatar.current.getMintableAmount(),
			// 	avatar.current.getTrustRelations(),
			// 	avatar.current.getTransactionHistory(10)
			// ])
			//
			// console.log({
			// 	balance,
			// 	mintAmount,
			// 	trustRels,
			// 	txnHistory
			// })
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
