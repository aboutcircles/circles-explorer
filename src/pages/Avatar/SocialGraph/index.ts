import { adaptAvatarForGraph } from 'domains/avatars/adapters/graphAdapter'
import type { Avatar } from 'domains/avatars/types'
import type { GroupedTrustRelations } from 'domains/trust/types'
import React from 'react'

import { SocialGraphWrapper } from './SocialGraphWrapper'

interface SocialGraphProperties {
	avatar: Avatar
	trustRelations: GroupedTrustRelations
}

// This component adapts our Avatar type to the CirclesAvatarFromEnvio type
// expected by the SocialGraphWrapper
function SocialGraph({
	avatar,
	trustRelations
}: SocialGraphProperties): JSX.Element | null {
	// Adapt the avatar to the CirclesAvatarFromEnvio type
	const adaptedAvatar = adaptAvatarForGraph(avatar, trustRelations)

	return React.createElement(SocialGraphWrapper, { avatar: adaptedAvatar })
}

export default SocialGraph
