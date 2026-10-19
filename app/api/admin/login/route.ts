import { adminConfigured, checkAdminPassword, startAdminSession } from "@/lib/adminAuth";
import { clientIp, json, readJson } from "@/lib/http";
import { tooMany } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return json(
      { error: "The owner page is not set up yet. Add ADMIN_PASSWORD (at least 8 characters) to the settings." },
      503
    );
  }

  const body = await readJson(request);
  const password = typeof body?.password === "string" ? body.password : "";

  if (tooMany(`admin-login:${clientIp(request)}`, 8, 15 * 60 * 1000)) {
    return json({ error: "Too many attempts. Please wait a few minutes." }, 429);
  }

  if (!checkAdminPassword(password)) {
    // A short pause makes guessing passwords slow
    await new Promise((resolve) => setTimeout(resolve, 600));
    return json({ error: "Wrong password." }, 401);
  }

  await startAdminSession();
  return json({ ok: true });
}
