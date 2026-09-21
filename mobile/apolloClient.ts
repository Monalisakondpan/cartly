import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { GRAPHQL_URL } from './config'

const httpLink = new HttpLink({ uri: GRAPHQL_URL })

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
})

export default client