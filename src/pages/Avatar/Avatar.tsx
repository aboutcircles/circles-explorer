// import type { Sdk, Avatar as AvatarType } from '@circles-sdk/sdk'
// import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { EventsTable } from 'shared/EventsTable'
import { Filter } from 'shared/Filter'
// import { useCirclesSdk } from 'providers/CirclesSdkProvider'

export default function Avatar() {
	const { address } = useParams()
	// const { sdk } = useCirclesSdk()
	// const avatar = useRef<AvatarType>()

	// useEffect(() => {
	// const loadAvatarInfo = async (sdk_: Sdk, address_: string) => {
	// 	console.log({ address_ })
	// 	avatar.current = await sdk_.getAvatar(address_)
	//
	// 	console.log(avatar.current.avatarInfo)
	//
	// 	const [balance, mintAmount, trustRels, txnHistory] = await Promise.all([
	// 		avatar.current.getTotalBalance(),
	// 		avatar.current.getMintableAmount(),
	// 		avatar.current.getTrustRelations(),
	// 		avatar.current.getTransactionHistory(10)
	// 	])
	//
	// 	console.log({
	// 		balance,
	// 		mintAmount,
	// 		trustRels,
	// 		txnHistory
	// 	})
	// }

	// if (address && sdk) {
	// void loadAvatarInfo(sdk, address).catch(console.log)
	// }
	// }, [])

	return (
		<div>
			<h1>Hello</h1>
			<h1>{address}</h1>

			<Filter />
			<EventsTable address={address} />
		</div>
	)
}
