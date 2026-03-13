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

/**
 * Resolve the JWT signing secret.
 *
 * Priority:
 * 1. SESSION_SECRET env var (explicit, recommended for production)
 * 2. Auto-generated secret stored in the SystemConfig table
 *
 * The auto-generated path means beginners never need to run `openssl rand`
 * — the app "just works" after deploy. The secret persists in the DB so
 * sessions survive across cold starts and redeploys.
 */
let cachedSecret: Uint8Array | null = null;

async function getSecret(): Promise<Uint8Array> {
  if (cachedSecret) return cachedSecret;

  // 1. Prefer explicit env var
  const envSecret = process.env.SESSION_SECRET;
  if (envSecret) {
    cachedSecret = new TextEncoder().encode(envSecret);
    return cachedSecret;
  }

  // 2. Read or create a persistent secret in the database
  const existing = await prisma.systemConfig.findUnique({
    where: { key: "session_secret" },
  });

  if (existing) {
    cachedSecret = new TextEncoder().encode(existing.value);
    return cachedSecret;
  }

  // Generate a cryptographically secure 32-byte secret
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const generated = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  try {
    await prisma.systemConfig.create({
      data: { key: "session_secret", value: generated },
    });
  } catch {
    // Race condition: another instance created it first — read theirs
    const raced = await prisma.systemConfig.findUnique({
      where: { key: "session_secret" },
    });
    if (raced) {
      cachedSecret = new TextEncoder().encode(raced.value);
      return cachedSecret;
    }
    // Shouldn't happen, but fall through with the generated value
  }

  cachedSecret = new TextEncoder().encode(generated);
  return cachedSecret;
}

export async function createSessionToken(session: Session): Promise<string> {
  const secret = await getSecret();
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const secret = await getSecret();
    const { payload } = await jwtVerify(token, secret);

    // Validate that the JWT contains the required session fields
    if (
      typeof payload.userId !== "string" ||
      typeof payload.whopUserId !== "string" ||
      typeof payload.plan !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      whopUserId: payload.whopUserId,
      email: (payload.email as string) ?? null,
      name: (payload.name as string) ?? null,
      profileImageUrl: (payload.profileImageUrl as string) ?? null,
      plan: payload.plan,
    };
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
