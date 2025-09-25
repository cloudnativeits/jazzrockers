import { GraphQLClient } from 'graphql-request';

const CUBEJS_API_URL = 'http://localhost:4000/cubejs-api/v1';
const CUBEJS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTMyNTMzNTYsImV4cCI6MTc1MzMzOTc1Nn0.0QwyGTp1PuMIm_xEvLJkcxTFoUZdGx7wfltidUvLOCs';

// The GraphQL endpoint is typically your API URL with /graphql
const CUBEJS_GRAPHQL_URL = CUBEJS_API_URL.replace('/v1', '/graphql');

export const graphqlClient = new GraphQLClient(CUBEJS_GRAPHQL_URL, {
  headers: {
    Authorization: CUBEJS_TOKEN,
  },
});