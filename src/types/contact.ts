import type { Address } from 'viem'
import type { TrustStatus } from 'types/trustStatus'
import type { AvatarType } from 'types/avatarType'

export interface Contact {
	address: Address
	name: string | undefined
	circles?: boolean
	picture?: string
	trust?: TrustStatus
	v2Trust?: TrustStatus
	version?: number | undefined
	avatarType?: AvatarType
}

export interface Contact2 {
	address: Address
	name: string | null | undefined
}
