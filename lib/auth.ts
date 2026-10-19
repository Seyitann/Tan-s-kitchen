import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { findCustomerById } from "./db";
import type { Customer } from "./db";

const COOKIE = "tk_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export function secret() {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 32) return new TextEncoder().encode(value);
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set to a random string of at least 32 characters."
    );
  }
  // Used only while developing on your computer
  return new TextEncoder().encode("dev-only-secret-not-for-the-live-website-0000");
}

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, key) =>
      error ? reject(error) : resolve(key)
    );
  });
}

// Passwords are never stored. Only a salted hash is, which cannot be turned back into the password.
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Logging in puts a signed token in a cookie that JavaScript on the page cannot read
export async function startSession(customerId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(customerId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function currentCustomer(): Promise<Customer | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub ? await findCustomerById(payload.sub) : null;
  } catch {
    return null;
  }
}

// The only customer details the browser ever receives
export function publicUser(customer: Customer) {
  return { name: customer.name, phone: customer.phone };
}
