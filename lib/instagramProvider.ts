import type { OAuthConfig } from "next-auth/providers/oauth";

interface InstagramProfile {
  user_id?: string;
  id?: string;
  username?: string;
  name?: string;
  profile_picture_url?: string;
}

/**
 * "Continue with Instagram" through Meta's Instagram API with Instagram Login.
 * Works with Instagram professional (Business or Creator) accounts. Instagram doesn't share an
 * email address, so these accounts have none until the creator adds one.
 * Docs: developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
 */
export function InstagramProvider(clientId: string, clientSecret: string): OAuthConfig<InstagramProfile> {
  return {
    id: "instagram",
    name: "Instagram",
    type: "oauth",
    clientId,
    clientSecret,
    checks: ["state"],
    client: { token_endpoint_auth_method: "client_secret_post" },
    authorization: {
      url: "https://www.instagram.com/oauth/authorize",
      params: { scope: "instagram_business_basic", response_type: "code", enable_fb_login: "false" },
    },
    token: {
      url: "https://api.instagram.com/oauth/access_token",
      // Instagram wants a plain form POST and answers in its own shape, so make the request ourselves.
      async request({ params, provider }) {
        const res = await fetch("https://api.instagram.com/oauth/access_token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: provider.clientId as string,
            client_secret: provider.clientSecret as string,
            grant_type: "authorization_code",
            redirect_uri: provider.callbackUrl,
            code: String(params.code ?? "").replace(/#_$/, ""),
          }),
        });
        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data[0] : json;
        if (!res.ok || !data?.access_token) throw new Error(`Instagram token exchange failed (${res.status})`);
        return { tokens: { access_token: data.access_token, token_type: "bearer" } };
      },
    },
    userinfo: {
      url: "https://graph.instagram.com/me",
      async request({ tokens }) {
        const url = new URL("https://graph.instagram.com/me");
        url.searchParams.set("fields", "user_id,username,name,profile_picture_url");
        url.searchParams.set("access_token", String(tokens.access_token));
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Instagram profile failed (${res.status})`);
        return res.json();
      },
    },
    profile(p) {
      return {
        id: String(p.user_id ?? p.id),
        name: p.name || (p.username ? `@${p.username}` : null),
        email: null,
        image: p.profile_picture_url ?? null,
      };
    },
    style: { logo: "", bg: "#fff", text: "#231d3b" },
  };
}
