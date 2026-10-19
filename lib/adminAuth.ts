import { createHash, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { secret } from "./auth";

// The owner logs in with one password, kept in the ADMIN_PASSWORD setting.
// This is separate from customer accounts, so no customer can ever become the owner.

const COOKIE = "tk_admin";
const TWELVE_HOURS = 60 * 60 * 12;

export function adminConfigured() {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password && password.length >= 8);
}

export function checkAdminPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (expected.length < 8) return false;
  // Comparing fixed-size fingerprints keeps the check the same speed whatever is typed
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

// A short fingerprint of the password. It rides inside the login cookie, so changing
// ADMIN_PASSWORD signs the owner out everywhere.
function passwordVersion() {
  return createHash("sha256")
    .update(process.env.ADMIN_PASSWORD ?? "")
    .digest("hex")
    .slice(0, 16);
}

export async function startAdminSession() {
  const token = await new SignJWT({ role: "admin", pv: passwordVersion() })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("owner")
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TWELVE_HOURS,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "admin" && payload.pv === passwordVersion();
  } catch {
    return false;
  }
}
