import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { getPool } from "@/lib/db";

export const SESSION_COOKIE_NAME = "shiftpilot_session";
const SESSION_TTL_DAYS = 14;

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string;
  roleCodes: string[];
  allowedPagePaths: string[];
  allowedBusinessIds: string[];
  allowedStoreIds: string[];
};

type AuthQueryRow = {
  user_id: string;
  email: string;
  display_name: string;
  role_code: string | null;
  page_path: string | null;
  business_code: string | null;
  store_code: string | null;
};

function getSessionSecret() {
  return process.env.AUTH_SECRET ?? "shift-pilot-local-secret";
}

export function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const computed = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(hash, "hex");

  if (computed.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(computed, expected);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(`${token}:${getSessionSecret()}`).digest("hex");
}

export async function createUserSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await getPool().query(
    `
      INSERT INTO user_sessions (user_id, session_token_hash, expires_at)
      VALUES ($1, $2, $3)
    `,
    [userId, tokenHash, expiresAt.toISOString()],
  );

  return {
    token,
    expiresAt,
  };
}

export async function revokeUserSession(token: string) {
  await getPool().query(
    `
      UPDATE user_sessions
      SET revoked_at = NOW()
      WHERE session_token_hash = $1
    `,
    [hashSessionToken(token)],
  );
}

export async function authenticateUser(email: string, password: string) {
  const result = await getPool().query<{
    id: string;
    email: string;
    display_name: string;
    password_salt: string;
    password_hash: string;
    is_active: boolean;
  }>(
    `
      SELECT id, email, display_name, password_salt, password_hash, is_active
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email.toLowerCase()],
  );

  const user = result.rows[0];

  if (!user || !user.is_active) {
    return null;
  }

  if (!verifyPassword(password, user.password_salt, user.password_hash)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
  };
}

async function getAuthenticatedUserByToken(token: string): Promise<AuthenticatedUser | null> {
  const result = await getPool().query<AuthQueryRow>(
    `
      SELECT
        u.id AS user_id,
        u.email,
        u.display_name,
        r.code AS role_code,
        pp.path AS page_path,
        bt.code AS business_code,
        s.code AS store_code
      FROM user_sessions us
      INNER JOIN users u ON u.id = us.user_id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      LEFT JOIN user_page_access upa ON upa.user_id = u.id
      LEFT JOIN page_permissions pp ON pp.id = upa.page_permission_id
      LEFT JOIN user_business_access uba ON uba.user_id = u.id
      LEFT JOIN business_types bt ON bt.id = uba.business_type_id
      LEFT JOIN user_store_access usa ON usa.user_id = u.id
      LEFT JOIN stores s ON s.id = usa.store_id
      WHERE us.session_token_hash = $1
        AND us.revoked_at IS NULL
        AND us.expires_at > NOW()
        AND u.is_active = TRUE
    `,
    [hashSessionToken(token)],
  );

  if (result.rowCount === 0) {
    return null;
  }

  const base = result.rows[0];

  return {
    id: base.user_id,
    email: base.email,
    displayName: base.display_name,
    roleCodes: unique(result.rows.map((row) => row.role_code).filter(Boolean)),
    allowedPagePaths: unique(result.rows.map((row) => row.page_path).filter(Boolean)),
    allowedBusinessIds: unique(result.rows.map((row) => row.business_code).filter(Boolean)),
    allowedStoreIds: unique(result.rows.map((row) => row.store_code).filter(Boolean)),
  };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  return getAuthenticatedUserByToken(sessionToken);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export function canAccessPath(user: AuthenticatedUser, pathname: string) {
  if (pathname === "/" || pathname === "") {
    return true;
  }

  return user.allowedPagePaths.includes(pathname);
}

function unique(values: (string | null | undefined)[]) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
