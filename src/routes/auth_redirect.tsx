import { createFileRoute } from '@tanstack/react-router'
import { oauth2Client } from '../fflogs/client';
import { OAuth2Token } from '@badgateway/oauth2-client';
import React from 'react';

export const Route = createFileRoute('/auth_redirect')({
  component: AuthRedirect,
  loader: async () => {
    const codeVerifier = window.sessionStorage.getItem("code-verifier") ?? "";
    console.log("getting token from redirect", document.location.toString());
    return oauth2Client.authorizationCode.getTokenFromCodeRedirect(
      document.location.toString(),
      {
        redirectUri: "https://localhost:5175/ffxiv_macro/auth_redirect",
        codeVerifier: codeVerifier,
        state: "randomstate"
      }
    ).then(
      token => ({
        error: null, token, codeVerifier
      })
    ).catch(
      (e: unknown) => {
        console.log("Failed", e);
        return ({
          error: String(e), codeVerifier, token: null
        });
      }
    )
  }
})

function AuthRedirect() {
  const {error, token, codeVerifier} = Route.useLoaderData();
  
  return <>
    <p>Code: {codeVerifier}</p>
    <p>Error: {error}</p>
    <p>Token: {JSON.stringify(token ?? {})}</p>
    <p><a href="auth_start">try again</a></p>
  </>
}