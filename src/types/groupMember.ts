import type { Contact } from 'types/contact'

export interface GroupMember {
	type: 'group' | 'human'
	item: Contact
}
