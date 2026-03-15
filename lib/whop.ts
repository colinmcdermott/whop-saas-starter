// ---------------------------------------------------------------------------
// Whop API helpers
// ---------------------------------------------------------------------------
// Direct fetch calls to Whop's API for maximum transparency.
// No SDK dependency — you can see exactly what's happening.
// ---------------------------------------------------------------------------

const WHOP_API_BASE = "https://api.whop.com";

// ---------------------------------------------------------------------------
// OAuth helpers
// ---------------------------------------------------------------------------

function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function randomString(len: number) {
  return base64url(crypto.getRandomValues(new Uint8Array(len)));
}

export async function sha256(str: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return base64url(new Uint8Array(hash));
}

/**
 * Build the Whop OAuth authorization URL with PKCE.
 * @param redirectUri - The OAuth callback URL
 * @param clientId - Whop App ID (from config or env)
 */
export async function buildAuthorizationUrl(redirectUri: string, clientId?: string) {
  if (!clientId) {
    clientId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
  }
  if (!clientId) throw new Error("Whop App ID is not configured");

  const codeVerifier = randomString(32);
  const codeChallenge = await sha256(codeVerifier);
  const state = randomString(16);
  const nonce = randomString(16);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email",
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return {
    url: `${WHOP_API_BASE}/oauth/authorize?${params}`,
    codeVerifier,
    state,
  };
}

/**
 * Exchange an authorization code for tokens using PKCE.
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  clientId?: string,
) {
  if (!clientId) {
    clientId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
  }
  const res = await fetch(`${WHOP_API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    }),
  });

  if (!res.ok) {
    const error = await res.text().catch(() => "Unknown error");
    throw new Error(`Token exchange failed (${res.status}): ${error}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    id_token?: string;
  }>;
}

// ---------------------------------------------------------------------------
// User info
// ---------------------------------------------------------------------------

/**
 * OIDC UserInfo response from Whop.
 * Fields depend on the scopes granted: openid, profile, email.
 */
export interface WhopUser {
  sub: string;                  // user ID (e.g. "user_xxxxx")
  name?: string;                // requires "profile" scope
  preferred_username?: string;  // requires "profile" scope
  picture?: string;             // requires "profile" scope
  email?: string;               // requires "email" scope
  email_verified?: boolean;     // requires "email" scope
}

/**
 * Fetch the authenticated user's profile from Whop's OIDC userinfo endpoint.
 */
export async function getWhopUser(accessToken: string): Promise<WhopUser> {
  const res = await fetch(`${WHOP_API_BASE}/oauth/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user (${res.status})`);
  }

  return res.json() as Promise<WhopUser>;
}

// ---------------------------------------------------------------------------
// Access verification
// ---------------------------------------------------------------------------

import { getConfig } from "./config";

/**
 * Check if a user has access to a specific Whop resource (product/experience).
 * Uses the Whop API directly for authoritative, real-time access checks.
 *
 * @see https://docs.whop.com/api-reference/users/check-access
 *
 * @example
 * const canAccess = await checkWhopAccess(
 *   session.whopUserId,
 *   "prod_xxxxx",
 *   apiKey,
 * );
 */
export async function checkWhopAccess(
  whopUserId: string,
  resourceId: string,
  apiKey: string,
): Promise<{ hasAccess: boolean; accessLevel: string }> {
  const res = await fetch(
    `${WHOP_API_BASE}/api/v1/users/${whopUserId}/access/${resourceId}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    },
  );

  if (res.ok) {
    const data = await res.json();
    return {
      hasAccess: data.has_access ?? false,
      accessLevel: data.access_level ?? "no_access",
    };
  }

  if (res.status === 403 || res.status === 404) {
    return { hasAccess: false, accessLevel: "no_access" };
  }

  console.error(`[Whop] Access check failed (${res.status}) for user ${whopUserId}`);
  return { hasAccess: false, accessLevel: "no_access" };
}

/**
 * Convenience wrapper that reads the API key from config.
 * Returns false if API key is not configured.
 *
 * @example
 * const { hasAccess } = await hasWhopAccess(session.whopUserId, "prod_xxxxx");
 */
export async function hasWhopAccess(
  whopUserId: string,
  resourceId: string,
): Promise<{ hasAccess: boolean; accessLevel: string }> {
  const apiKey = await getConfig("whop_api_key");
  if (!apiKey) {
    console.warn("[Whop] API key not configured; cannot verify access");
    return { hasAccess: false, accessLevel: "no_access" };
  }
  return checkWhopAccess(whopUserId, resourceId, apiKey);
}

// ---------------------------------------------------------------------------
// Webhook verification
// ---------------------------------------------------------------------------

/**
 * Verify a Whop webhook signature.
 * Whop uses the standardwebhooks format: HMAC-SHA256 of "{msg_id}.{timestamp}.{body}".
 */
export async function verifyWebhookSignature(
  body: string,
  headers: {
    "webhook-id"?: string | null;
    "webhook-signature"?: string | null;
    "webhook-timestamp"?: string | null;
  },
  webhookSecret?: string,
): Promise<boolean> {
  const secret = webhookSecret ?? process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) throw new Error("Webhook secret is not configured");

  const msgId = headers["webhook-id"];
  const signature = headers["webhook-signature"];
  const timestamp = headers["webhook-timestamp"];

  if (!msgId || !signature || !timestamp) return false;

  // Check timestamp to prevent replay attacks (5 minute tolerance)
  const now = Math.floor(Date.now() / 1000);
  const webhookTimestamp = parseInt(timestamp, 10);
  if (Math.abs(now - webhookTimestamp) > 300) return false;

  // Convert secret string to bytes for HMAC key
  const secretBytes = new TextEncoder().encode(secret);

  const toSign = `${msgId}.${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(toSign)
  );

  const expectedSignature = `v1,${base64url(new Uint8Array(signatureBytes))}`;

  // Check against all provided signatures (space-separated)
  // Use constant-time comparison to prevent timing attacks
  const providedSignatures = signature.split(" ");
  const expectedBytes = new TextEncoder().encode(expectedSignature);
  return providedSignatures.some((sig) => {
    const sigBytes = new TextEncoder().encode(sig);
    if (sigBytes.length !== expectedBytes.length) return false;
    // XOR all bytes and accumulate — constant time regardless of match position
    let diff = 0;
    for (let i = 0; i < sigBytes.length; i++) {
      diff |= sigBytes[i] ^ expectedBytes[i];
    }
    return diff === 0;
  });
}
