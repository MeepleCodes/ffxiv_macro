import { GraphQLClient } from 'graphql-request';
import { OAuth2Client } from '@badgateway/oauth2-client';
import { RequestMiddleware } from 'graphql-request';

const oauth2Client = new OAuth2Client({
  server: import.meta.env.VITE_FFLOGS_OAUTH_URL,
  clientId: import.meta.env.VITE_FFLOGS_CLIENT_ID,
  clientSecret: import.meta.env.VITE_FFLOGS_CLIENT_SECRET,
  tokenEndpoint: import.meta.env.VITE_FFLOGS_TOKEN_PATH,
  authorizationEndpoint: import.meta.env.VITE_FFLOGS_AUTH_PATH
});

const requestMiddleware: RequestMiddleware = async (request) => {
  // const ep = await oauth2Client.getEndpoint("tokenEndpoint");
  // console.log(`Requesting client credentials token from ${ep}`);
  const token = await oauth2Client.clientCredentials();

  const headers = new Headers(request.headers)
  headers.set(`Authorization`, `Bearer ${token.accessToken}`);

  return {
    ...request,
    headers,
  }
}

export async function fetchAll<T, R>(query: string, variables: PagedVariables, getPage: (repsponse: R) => Page<T>) {
  const allData: T[] = [];
  function nextPage(page: Page<T>): Promise<Page<T>> | null {
    if ((page.nextPageTimestamp ?? 0) === 0) return null;
    return client.request<R>(
      query,
      { ...variables, startTime: page.nextPageTimestamp }
    ).then(getPage);
  }
  for (let page: Page<T> | null = await client.request<R>(query, variables).then(getPage); page != null; page = await nextPage(page)) {
    allData.push(...page.data);
  }
  return allData;
}export type PagedVariables = { startTime: number; endTime: number; };
export type Page<T> = {
  data: T[];
  nextPageTimestamp?: number;
};
export const client = new GraphQLClient(import.meta.env.VITE_FFLOGS_PUBLIC_API, { requestMiddleware });

