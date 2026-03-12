import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Session {
  userId: string;
  whopUserId: string;
  email: string | null;
  name: string | null;
  profileImageUrl: string | null;
  plan: string;
}

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET environment variable is required");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

export async function setSessionCookie(session: Session) {
  const token = await createSessionToken(session);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

// ---------------------------------------------------------------------------
// Session retrieval
// ---------------------------------------------------------------------------

/**
 * Get the current session, or null if not authenticated.
 * Use this in server components and API routes.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  return session;
}

/**
 * Require an authenticated session. Redirects to login if not authenticated.
 * Use this in server components for protected pages.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Refresh the session with latest data from the database.
 * Call this after plan changes or profile updates.
 */
export async function refreshSession(whopUserId: string): Promise<Session | null> {
  const user = await prisma.user.findUnique({
    where: { whopUserId },
  });

  if (!user) return null;

  const session: Session = {
    userId: user.id,
    whopUserId: user.whopUserId,
    email: user.email,
    name: user.name,
    profileImageUrl: user.profileImageUrl,
    plan: user.plan,
  };

  await setSessionCookie(session);
  return session;
}
