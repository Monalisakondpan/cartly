import { useQuery } from '@apollo/client/react'
import { gql } from '@apollo/client'

const ME_QUERY = gql`
  query Me {
    me {
      email
      role
      name
    }
  }
`

type SessionIndicatorProps = {
  token: string
}

function SessionIndicator({ token }: SessionIndicatorProps) {
  const { data } = useQuery(ME_QUERY, {
    context: {
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
    fetchPolicy: 'no-cache',
  })

  const me = data?.me
  if (!me) return null

  const roleLabel = me.role === 'owner' ? 'Seller' : me.role === 'customer' ? 'Customer' : 'Admin'
  const displayName = me.name || me.email

  return (
    <span style={{ fontSize: '13px', color: 'white', opacity: 0.85 }}>
      {displayName} ({roleLabel})
    </span>
  )
}

export default SessionIndicator