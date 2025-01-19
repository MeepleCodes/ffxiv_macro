/* eslint-disable @typescript-eslint/no-explicit-any */
import { promises } from 'fs';
import { Variables } from 'graphql-request';
import { Page, PagedVariables } from './client';
import { LocationSaveData } from '../analysis/locator';
import { getAllEvents, locationsFetchVars, locationsQuery, locatorFromEvents } from './locations';
import { Event } from './types';
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
export const client = new GraphQLClient(import.meta.env.VITE_FFLOGS_PUBLIC_API, { requestMiddleware });

export type FetchFunction<T, V = any> = (query: string, variables: V) => Promise<T>;

type IorFOptionsNoPostProcess<T> = {
  force?: boolean;
  debug?: boolean;
  fetch?: FetchFunction<T>;
};
type IorFOptionsWithPostProcess<T, I> = {
  force?: boolean;
  debug?: boolean;
  postProcess: (response: I) => T | Promise<T>;
  fetch?: FetchFunction<I>;
}
// export type IorFOptions<T, I = T> = IorFOptionsNoPostProcess<T> | IorFOptionsWithPostProcess<T, I>;
 export type IorFOptions<T> = IorFOptionsNoPostProcess<T> | IorFOptionsWithPostProcess<T, any>;
/**
 * TODO: The typing of "with postprocessing" and "without postprocessing" needs fixing here, 
 * but doing so is a mess.
 * 
 * I think the answer may lie in having yet more overrides?
 * 
 * When I've fixed that, remove some of the explicit type parameters and "as" casts in locations.ts
 **/ 
export async function importOrFetch<T>(path: string, query: string, variables: Variables, options: IorFOptions<T>): Promise<T>;
export async function importOrFetch<T>(path: string, query: string, variables: Variables[], options: IorFOptions<T>): Promise<T[]>;
export async function importOrFetch<T>(path: string, query: string, variables: Variables | Variables[], options: IorFOptions<T>): Promise<T | T[]> {
  if(!(options.force ?? false)) {
    try {
      const {default: imported} = await import(path, { assert: { type: "json" } }) as {default: T};
      return imported;
    }
    catch(_) {
      console.log("Import of %s failed, fetching", path);
    }
  }
  if(Array.isArray(variables)) {
    const dataSets = await Promise.all(
      variables.map(async varSet => {
        if(options.debug === true) console.log("Sending query %s with variables %s", query, varSet);
        const rawData = options.fetch !== undefined ? await options.fetch(query, varSet) : await client.request(query, varSet as Variables);
        const data = ("postProcess" in options) ? await options.postProcess(rawData) : rawData;
        return data as T;
      })
    );
    console.log("Fetched %d sets of data", dataSets.length);
    await promises.writeFile(path, JSON.stringify(dataSets, null, 2));
    console.log("Saved %d sets of data to %s", dataSets.length, path);
    return dataSets;
  } else {
    if(options.debug === true) console.log("Sending query %s with variables %s", query, variables);
    const rawData = options.fetch !== undefined ? await options.fetch(query, variables) : await  client.request(query, variables);
    const data = options.postProcess ? await options.postProcess(rawData) : rawData;
    await promises.writeFile(path, JSON.stringify(data, null, 2));
    console.log("Saved data to %s", path);
    return data as T;
  }
}

export function makeFetchAllQuery<T>(getPage: (response: any) => Page<T>): FetchFunction<T[], PagedVariables> {
  return async function(query: string, variables: {startTime: number, endTime: number}): Promise<T[]> {
    const allData: T[] = [];
    function nextPage(page: Page<T>): Promise<Page<T>> | null  {
      if((page.nextPageTimestamp ?? 0) === 0) return null;
      return client.request(query, {...variables, startTime: page.nextPageTimestamp}).then(getPage);
    }
    for(let page: Page<T>|null = await client.request(query, variables).then(getPage); page != null; page = await nextPage(page)) {
      allData.push(...page.data);
    }
    return allData;
  }
}




export async function importOrFetchLocations(path: string, vars: locationsFetchVars | locationsFetchVars[], force = false) {
  return importOrFetch<LocationSaveData | LocationSaveData[]>(
    path,
    locationsQuery,
    vars,
    {
      fetch: getAllEvents,
      postProcess: (events) => locatorFromEvents(events as Event[]).toSaveData(),
      force
    }
  );
}