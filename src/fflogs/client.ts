import { GraphQLClient } from 'graphql-request';
import { generateCodeVerifier, OAuth2Client, OAuth2Fetch } from '@badgateway/oauth2-client';

export const oauth2Client = new OAuth2Client({
  server: import.meta.env.VITE_FFLOGS_OAUTH_URL,
  // clientId: import.meta.env.VITE_FFLOGS_CLIENT_ID,
  clientId: "9df7c91e-f51b-44a2-964e-45fb1a9ec4e4",
  tokenEndpoint: import.meta.env.VITE_FFLOGS_TOKEN_PATH,
  authorizationEndpoint: import.meta.env.VITE_FFLOGS_AUTH_PATH
});
const fetchWrapper = new OAuth2Fetch({
  client: oauth2Client,

  getNewToken: async () => {
    
    const fromRedirect = "fromRedirect";
    const loc = new URL(document.location.toString());
    const bare = new URL(loc);
    bare.search = "";
    bare.searchParams.set(fromRedirect, "1");
    const redirectUri = bare.toString();
    if(loc.searchParams.has(fromRedirect)) {
      console.log("fromRedirect present in url, assuming return from oauth, trying to get token");
      const codeVerifier = window.localStorage.getItem("codeverifier") ?? "";
      console.log("Verifier is", codeVerifier);
      const oauth2Token = await oauth2Client.authorizationCode.getTokenFromCodeRedirect(
        document.location.toString(),
        {
          redirectUri,
          codeVerifier,
          state: "somestate"
        }
      );
      console.log("Got token", oauth2Token, "from redirect");
      return oauth2Token;
    } else {
      console.log("No fromRedirect in url, redirecting to fflogs for authentication");
      const codeVerifier = await generateCodeVerifier();
      window.localStorage.setItem("codeverifier", codeVerifier);
      console.log("Verifier is", codeVerifier);
      document.location = await oauth2Client.authorizationCode.getAuthorizeUri({
        redirectUri,
        codeVerifier,
        state: "somestate",
        scope: ["view-user-profile"]
      });
      return null;
    }

    // In a browser this might work as follows:
   
  },

  /**
   * This function is called whenever the active token changes. Using this is
   * optional, but it may be used to (for example) put the token in off-line
   * storage for later usage.
   */
  storeToken: (token) => {
    window.localStorage.setItem("token-store", JSON.stringify(token));
  },

  /**
   * Also an optional feature. Implement this if you want the wrapper to try a
   * stored token before attempting a full re-authentication.
   *
   * This function may be async. Return null if there was no token.
   */
  getStoredToken: () => {
    const token = window.localStorage.getItem('token-store');
    if (token) return JSON.parse(token);
    return null;
  }

});


// oauth2-client types fetchWrapper.fetch slightly wrong, so mangle it
export const client = new GraphQLClient(
  import.meta.env.VITE_FFLOGS_PRIVATE_API,
  { fetch: (input: RequestInfo | URL, init?: RequestInit) => fetchWrapper.fetch(input as RequestInfo, init) }
);

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


