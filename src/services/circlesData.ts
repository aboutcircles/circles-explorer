import { CirclesRpc, CirclesData } from '@circles-sdk/data'
import { Profiles } from '@circles-sdk/profiles'

import {
	CIRCLES_INDEXER_URL,
	CIRCLES_PROFILE_SERVICE_URL
} from 'constants/common'

// export const config: CirclesConfig = {
// 	pathfinderUrl: 'https://pathfinder.aboutcircles.com',
// 	circlesRpcUrl: CIRCLES_INDEXER_URL,
// 	// profileServiceUrl: 'https://chiado-pathfinder.aboutcircles.com/profiles/',
// 	profileServiceUrl:
// 		'https://static.174.163.76.144.clients.your-server.de/profiles/',
// 	v1HubAddress: '0x29b9a7fbb8995b2423a71cc17cf9810798f6c543',
// 	v2HubAddress: '0xa5c7ADAE2fd3844f12D52266Cb7926f8649869Da',
// 	nameRegistryAddress: '0x738fFee24770d0DE1f912adf2B48b0194780E9AD',
// 	migrationAddress: '0xe1dCE89512bE1AeDf94faAb7115A1Ba6AEff4201',
// 	baseGroupMintPolicy: '0x5Ea08c967C69255d82a4d26e36823a720E7D0317'
// }

const circlesRpc = new CirclesRpc(CIRCLES_INDEXER_URL)

export const circlesData = new CirclesData(circlesRpc)

export const circlesProfiles = new Profiles(CIRCLES_PROFILE_SERVICE_URL)
