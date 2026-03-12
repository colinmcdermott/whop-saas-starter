import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { exchangeCodeForTokens, getWhopUser } from "@/lib/whop";
import { setSessionCookie, type Session } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/auth/callback?code=...&state=...
 *
 * Handles the OAuth callback from Whop:
 * 1. Verifies the state parameter matches what we stored
 * 2. Exchanges the authorization code for tokens using PKCE
 * 3. Fetches the user profile from Whop
 * 4. Creates or updates the user in our database
 * 5. Sets a session cookie (JWT)
 * 6. Redirects to the original destination
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  // Handle OAuth errors from Whop
  if (error) {
    const description = request.nextUrl.searchParams.get("error_description") ?? "";
    return NextResponse.redirect(
      new URL(`/auth-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(description)}`, request.url)
    );
  }

  if (!code || !returnedState) {
    return NextResponse.redirect(
      new URL("/auth-error?error=missing_params", request.url)
    );
  }

  // Retrieve and validate the stored OAuth state
  const cookieStore = await cookies();
  const storedOAuthState = cookieStore.get("oauth_state")?.value;
  if (!storedOAuthState) {
    return NextResponse.redirect(
      new URL("/auth-error?error=expired_session", request.url)
    );
  }

  let codeVerifier: string;
  let expectedState: string;
  let next: string;
  try {
    const parsed = JSON.parse(storedOAuthState);
    codeVerifier = parsed.codeVerifier;
    expectedState = parsed.state;
    next = parsed.next || "/dashboard";
  } catch {
    return NextResponse.redirect(
      new URL("/auth-error?error=invalid_state", request.url)
    );
  }

  // Verify state matches to prevent CSRF
  if (returnedState !== expectedState) {
    return NextResponse.redirect(
      new URL("/auth-error?error=state_mismatch", request.url)
    );
  }

  // Clear the OAuth state cookie
  cookieStore.delete("oauth_state");

  // Build the redirect URI (must match exactly what was sent to /authorize)
  const proto =
    request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const redirectUri = `${proto}://${host}/api/auth/callback`;

  try {
    // Exchange the code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier, redirectUri);

    // Fetch user profile from Whop
    const whopUser = await getWhopUser(tokens.access_token);

    // Upsert user in our database
    const user = await prisma.user.upsert({
      where: { whopUserId: whopUser.id },
      update: {
        email: whopUser.email ?? null,
        name: whopUser.name ?? whopUser.username ?? null,
        profileImageUrl: whopUser.profile_picture?.url ?? null,
      },
      create: {
        whopUserId: whopUser.id,
        email: whopUser.email ?? null,
        name: whopUser.name ?? whopUser.username ?? null,
        profileImageUrl: whopUser.profile_picture?.url ?? null,
        plan: "free",
      },
    });

    // Create a session
    const session: Session = {
      userId: user.id,
      whopUserId: user.whopUserId,
      email: user.email,
      name: user.name,
      profileImageUrl: user.profileImageUrl,
      plan: user.plan,
    };

    await setSessionCookie(session);

    return NextResponse.redirect(new URL(next, request.url));
  } catch (err) {
    console.error("[OAuth Callback] Error:", err);
    return NextResponse.redirect(
      new URL("/auth-error?error=exchange_failed", request.url)
    );
  }
}
