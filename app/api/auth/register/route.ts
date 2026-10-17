import { hashPassword, publicUser, startSession } from "@/lib/auth";
import { createCustomer } from "@/lib/db";
import { clientIp, json, readJson } from "@/lib/http";
import { normalizeNgPhone } from "@/lib/phone";
import { tooMany } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return json({ error: "Invalid request." }, 400);

  const name = String(body.name ?? "").trim().replace(/\s+/g, " ");
  const phone = normalizeNgPhone(String(body.phone ?? ""));
  const password = String(body.password ?? "");

  if (name.length < 2 || name.length > 60) {
    return json({ error: "Please enter your name." }, 400);
  }
  if (!phone) {
    return json({ error: "Enter a valid Nigerian phone number, like 0803 123 4567." }, 400);
  }
  if (password.length < 8 || password.length > 100) {
    return json({ error: "Your password needs at least 8 characters." }, 400);
  }
  if (tooMany(`register:${clientIp(request)}`, 10, 60 * 60 * 1000)) {
    return json({ error: "Too many attempts. Please try again later." }, 429);
  }

  const customer = await createCustomer({
    name,
    phone,
    passwordHash: await hashPassword(password),
  });
  if (!customer) {
    return json({ error: "An account with this phone number already exists. Try logging in." }, 409);
  }

  await startSession(customer.id);
  return json({ user: publicUser(customer) }, 201);
}
