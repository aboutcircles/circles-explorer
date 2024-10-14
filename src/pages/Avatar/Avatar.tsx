import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { AvatarRow } from '@circles-sdk/data'

import type { Row } from 'components/Table'
import { EventsTable } from 'shared/EventsTable'
import { Filter } from 'shared/Filter'
import { circlesData } from 'services/circlesData'
import { EyePopoverDetails } from 'shared/EyePopoverDetails'

import { AvatarInfo } from './AvatarInfo'

export default function Avatar() {
	const { address } = useParams()
	const [avatarInfo, setAvatarInfo] = useState<AvatarRow>()

	useEffect(() => {
		const loadAvatarInfo = async (address_: string) => {
			console.log({ address_ })

			// const profile = await sdk_.profiles?.get(avatarInfo.cidV0)

			// console.log({ profile })

			// console.log(avatar.current.avatarInfo)
			//
			const [
				avatarInfoResult,
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

			setAvatarInfo(avatarInfoResult)

			console.log({
				avatarInfoResult,
				totalBalance,
				totalBalanceV2,
				tokenBalances,
				txHistory,
				trustRelations
				// aggregatedTrustRelations
			})
		}

		if (address) {
			void loadAvatarInfo(address)
		}
	}, [address])

	return (
		<div>
			<div className='flex justify-between'>
				<AvatarInfo cidV0={avatarInfo?.cidV0} />

				{avatarInfo ? (
					<EyePopoverDetails item={avatarInfo as unknown as Row} />
				) : null}
			</div>

			<Filter />
			<EventsTable address={address} />
		</div>
	)
}
