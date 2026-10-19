import { endAdminSession } from "@/lib/adminAuth";
import { json } from "@/lib/http";

export async function POST() {
  await endAdminSession();
  return json({ ok: true });
}
