import { createFileRoute } from '@tanstack/react-router'
import { oauth2Client } from '../fflogs/client'
import { generateCodeVerifier } from '@badgateway/oauth2-client'

export const Route = createFileRoute('/auth_start')({
  loader: async () => {
    let code = window.sessionStorage.getItem("code-verifier");
    if(code == null) {
      code = await generateCodeVerifier();
      window.sessionStorage.setItem("code-verifier", code);
    }
    console.log("Generated code verifier:", code);
    const url = await oauth2Client.authorizationCode.getAuthorizeUri({
      redirectUri: "https://localhost:5175/ffxiv_macro/auth_redirect",
      codeVerifier: code,
      state: "randomstate",
      scope: [],
      extraParams: {
        "response_mode": "form_post"
      }
    });
    console.log("Directing to", url);
    return {code, url};
  },
  component: AuthStart
})

function AuthStart() {
  const {code, url} = Route.useLoaderData();
  return <>
    Code is <pre>{code}</pre>.
    <a href={url}>Request authentication</a>
  </>
}