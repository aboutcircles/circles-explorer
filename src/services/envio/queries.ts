export const queries = {
	ALL_INVITES: `
    query allInvites($address: String, $limit: Int, $offset: Int) {
      TrustRelation(
        where: {
          trustee_id: {_eq: $address},
          truster_id: {_neq: $address},
          version: { _eq: 2 },
          limit: {_neq: 0},
          expiryTime: {_neq: 0}
        },
        order_by:{ timestamp: desc },
        offset: $offset,
        limit: $limit
      ) {
        truster {
          id
          cidV0
          profile {
            name
            id
            previewImageUrl
          }
          trustsReceivedCount
          tokenId
          balances {
            token {
              id
            }
            balance
          }
        }
      }
    }
  `,

	GET_TRUST_NETWORK_RELATIONS: `
    query getTrustNetworkRelations($addresses: [String!]) {
      TrustRelation(
        where: {
          _or: [
            {truster_id: {_in: $addresses}},
            {trustee_id: {_in: $addresses}}
          ],
          version: {_eq: 2},
          limit: {_neq: 0},
          expiryTime: {_neq: 0}
        }
      ) {
        id
        trustee_id
        truster_id
        isMutual
        version
        timestamp
        limit
        trustee {
          id
          profile {
            name
            previewImageUrl
          }
        }
        truster {
          id
          profile {
            name
            previewImageUrl
          }
        }
      }
    }
  `,

	ALL_ACCEPTED_INVITES: `
    query allAcceptedInvites($address: String, $limit: Int, $offset: Int) {
      Avatar(
        where: {
          invitedBy: {_eq: $address}
          cidV0: { _is_null: false }
          avatarType: { _eq:"RegisterHuman"}
          id: {_neq: $address}
        },
        order_by:{ timestamp: desc },
        offset: $offset,
        limit: $limit
      ) {
        id
        cidV0
        timestamp
        avatarType
        profile {
          name
          id
          description
          previewImageUrl
        }        
      }
    }
  `,

	ALL_PENDING_INVITES: `
    query allPendingInvites($address: String, $limit: Int, $offset: Int) {
      TrustRelation(
        where: {
          truster_id: {_eq: $address},
          trustee: {_or:[{avatarType: {_eq: "Invite"}},{avatarType: {_eq: "Migrating"}}]},
          limit: {_neq: 0},
          expiryTime: {_neq: 0}
        },
        order_by: {timestamp: desc},
        offset: $offset,
        limit: $limit
      ) {
        timestamp
        trustee {
          id
          cidV0
          timestamp
          profile {
            name
            id
            description
            previewImageUrl
          }
        }
      }
    }
  `,

	TOTAL_INVITES: `
    query getTotalInvitesQuery($address: String) {
      Avatar(
        where: {
          id: {_eq: $address},
        },
      ) {
        trustsReceivedCount
      }
    }
  `,

	TRUST_FOR_ADDRESS: `
  query getTrustForAddress($address: String, $userAddress: String) {
  TrustRelation(
    where: {version: {_eq: 2}, _or: [{trustee_id: {_eq: $address}, truster_id: {_eq: $userAddress}}, {trustee_id: {_eq: $userAddress}, truster_id: {_eq: $address}}], limit: {_neq: 0}, expiryTime: {_neq: 0}} 
  ) {
     version
    isMutual
    truster_id
    trustee_id
  }
}
  `,

	TRUST_NETWORK: `
  query trustNetwork($address: String, $version: Int, $limit: Int, $offset: Int) {
  TrustRelation(
    where: {version: {_eq: $version}, 
    _or: [{trustee_id: {_eq: $address}}, 
    {truster_id: {_eq: $address}}], 
    trustee: {avatarType:{_neq: "RegisterGroup"}},
    truster: {avatarType:{_neq: "RegisterGroup"}}, 
    limit: {_neq: 0}, expiryTime: {_neq: 0}},
    order_by: {timestamp: desc}
    offset: $offset
    limit: $limit
  ) {
     version
    isMutual
    truster {
      avatarType,
      id,
      version,
      profile {name, previewImageUrl}
    } 
    trustee {
     avatarType,
     id,
     version,
     profile {name, previewImageUrl}
    }
  }
}
  `,

	PROFILE_FOR_ADDRESS: `query getProfileForAddressQuery($address: String) {
  Avatar(where: {id: {_eq: $address}}) {
    id
    isVerified
    invitedBy
    cidV0
    lastMint
    version
    avatarType
    
    balances {
      token {
      	id
      	tokenType
      	totalSupply
      }
    }
    
    trustsGiven {
    	trustee_id
    	truster_id
    	isMutual
    	version
		}
		trustsReceived {
			trustee_id
			truster_id
			isMutual
			version
		}
    trustsGivenCount
    trustsReceivedCount
    
    profile {
        name
        id
        description
        previewImageUrl         
      }
  }
}
`,

	GET_GROUP: `query getGroup($address: String!) {
  Avatar(where: {id: {_eq: $address}, avatarType:{_eq: "RegisterGroup"}}) {
    id
    isVerified
    invitedBy
    cidV0
    lastMint
    version
    avatarType
    profile {
      name
      id
      description
      previewImageUrl         
    }
  }
}
`,

	VERIFIED_AND_UNVERIFIED_CRC_TOKENS: `query verifiedAndUnverifiedCRCTokens($address: String) {
    AvatarBalance(where: {avatar_id: {_eq: $address}, balance: {_gt: 0}}) {
      balance
      lastCalculated
      token {
        id
        tokenType
        tokenOwner {
          id
          profile {
            name
            previewImageUrl
          }
          isVerified
          trustsGiven(where: {trustee_id: {_eq: $address}, version: {_eq: 2}, limit: {_neq: 0}, expiryTime: {_neq: 0}}) {
            id
          }
          trustsReceived(where: {truster_id: {_eq: $address}, version: {_eq: 2}, limit: {_neq: 0}, expiryTime: {_neq: 0}}) {
            id
          }
        }
      }
    }
  }
`,

	CHECK_IF_ADDRESS_EXISTS_IN_REGISTRY: `
query checkIfAddressExistsInRegistryQuery($address: String!) {
  Avatar(
    where: { 
      id: { _eq: $address },
      cidV0: { _is_null: false }
    }
  ) {
    id
    cidV0
  }
}
`,

	GET_TRUSTEES_ON_V2: `query getTrusteesThatAreOnV2($address: String) {
  TrustRelation(
    where: {truster_id: {_eq: $address}, trustee: {version: {_eq: 2}}, limit: {_neq: 0}, expiryTime: {_neq: 0}}
  ) {
    trustee {
      id
    }
  }
}`,
	GET_GROUP_MEMBERSHIPS: `query getGroupMemberships($address: String) {
  TrustRelation(where: {trustee_id: {_eq: $address}, truster: {avatarType:{_eq: "RegisterGroup"}}}) {
    isMutual
    truster {
      cidV0
      avatarType
      id
      profile {
        name
        description
        imageUrl
        id
        previewImageUrl
      }
    }
  }
}`,
	GET_MEMBERSHIPS_FOR_GROUP: `query getMembershipsForGroup($address: String) {
  TrustRelation(where: {truster_id: {_eq: $address}}) {
    trustee {
      id
      avatarType
      profile {
        name
        description
        imageUrl
        id
        previewImageUrl
      }
    }
  }
}`,
	GET_TRANSFERS_BETWEEN_USERS: `query getTransfersBetweenUsers($first: String, $second: String, $limit: Int, $offset: Int) {
  Transfer(where: {
    _or:[
      {from:{_eq:$first}, to:{_eq:$second}}
      {to:{_eq:$first}, from:{_eq:$second}}
    ],
    isPartOfStreamOrHub:{_eq:false}
  }, limit: $limit, offset: $offset) {
    transactionHash
    from
    to
    value
    demurrageFrom {
      id
      value
    }
    demurrageTo {
      id
      from
      value
    }
    timestamp
  }
}`,
	FIND_PROFILES_BY_USERNAME: `
  query findByUserName ($query: String) {
  Avatar(where: {profile:{name: {_iregex: $query}}}) {
   id
    invitedBy
    cidV0
    lastMint
    version
    avatarType
    profile {
        name
        id
        description
        previewImageUrl         
      }
  }
}`
}
