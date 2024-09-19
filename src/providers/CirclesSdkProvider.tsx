import { useEffect, createContext, useMemo, useState, useContext } from 'react'
import type { CirclesConfig } from '@circles-sdk/sdk'
import { Sdk } from '@circles-sdk/sdk'
import { BrowserProviderContractRunner } from '@circles-sdk/adapter-ethers'
import type { Address } from 'viem'

import { CIRCLES_INDEXER_URL } from 'constants/common'

export const config: CirclesConfig = {
	pathfinderUrl: 'https://pathfinder.aboutcircles.com',
	circlesRpcUrl: CIRCLES_INDEXER_URL,
	profileServiceUrl: 'https://chiado-pathfinder.aboutcircles.com/profiles/',
	v1HubAddress: '0x29b9a7fbb8995b2423a71cc17cf9810798f6c543',
	v2HubAddress: '0xa5c7ADAE2fd3844f12D52266Cb7926f8649869Da',
	nameRegistryAddress: '0x738fFee24770d0DE1f912adf2B48b0194780E9AD',
	migrationAddress: '0xe1dCE89512bE1AeDf94faAb7115A1Ba6AEff4201',
	baseGroupMintPolicy: '0x5Ea08c967C69255d82a4d26e36823a720E7D0317'
}

interface CirclesSdkContextProperties {
	sdk: Sdk | null
	circlesAddress: Address | null
}

const CirclesSdkContext = createContext<CirclesSdkContextProperties>({
	sdk: null,
	circlesAddress: null
})

export function CirclesSdkProvider({
	children
}: {
	children: React.ReactNode
}) {
	const [sdk, setSdk] = useState<Sdk | null>(null)
	const [circlesAddress, setCirclesAddress] = useState<Address | null>(null)

	useEffect(() => {
		const asyncInit = async () => {
			const adapter = new BrowserProviderContractRunner()
			await adapter.init()

			setCirclesAddress(adapter.address as Address)
			setSdk(new Sdk(config, adapter))
		}

		void asyncInit()
	}, [])

	const value = useMemo(() => ({ sdk, circlesAddress }), [sdk, circlesAddress])

	return (
		<CirclesSdkContext.Provider value={value}>
			{children}
		</CirclesSdkContext.Provider>
	)
}

export const useCirclesSdk = () => useContext(CirclesSdkContext)
