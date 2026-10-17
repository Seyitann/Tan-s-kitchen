import { publicUser, startSession, verifyPassword } from "@/lib/auth";
import { findCustomerByPhone } from "@/lib/db";
import { clientIp, json, readJson } from "@/lib/http";
import { normalizeNgPhone } from "@/lib/phone";
import { tooMany } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return json({ error: "Invalid request." }, 400);

  const phone = normalizeNgPhone(String(body.phone ?? ""));
  const password = String(body.password ?? "");
  if (!phone || !password) {
    return json({ error: "Enter your phone number and password." }, 400);
  }
  if (tooMany(`login:${clientIp(request)}:${phone}`, 10, 15 * 60 * 1000)) {
    return json({ error: "Too many attempts. Please wait a few minutes and try again." }, 429);
  }

  const customer = await findCustomerByPhone(phone);
  const valid = customer ? await verifyPassword(password, customer.passwordHash) : false;
  if (!customer || !valid) {
    return json({ error: "Wrong phone number or password." }, 401);
  }

  await startSession(customer.id);
  return json({ user: publicUser(customer) });
}
