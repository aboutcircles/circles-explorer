import type { Contact } from 'types/contact'

export interface Group extends Contact {
	mutualTrust: boolean
	description?: string
}
