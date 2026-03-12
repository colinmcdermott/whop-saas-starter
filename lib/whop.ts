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
 */
export async function buildAuthorizationUrl(redirectUri: string) {
  const clientId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
  if (!clientId) throw new Error("NEXT_PUBLIC_WHOP_APP_ID is required");

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
 * No client_secret needed — PKCE replaces it.
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string
) {
  const res = await fetch(`${WHOP_API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.NEXT_PUBLIC_WHOP_APP_ID,
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

export interface WhopUser {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  profile_picture?: { url: string } | null;
}

/**
 * Fetch the authenticated user's profile from Whop.
 */
export async function getWhopUser(accessToken: string): Promise<WhopUser> {
  const res = await fetch(`${WHOP_API_BASE}/api/v5/me`, {
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
  }
): Promise<boolean> {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) throw new Error("WHOP_WEBHOOK_SECRET is required");

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

  // Check against all provided signatures (comma-separated)
  const providedSignatures = signature.split(" ");
  return providedSignatures.some((sig) => sig === expectedSignature);
}
