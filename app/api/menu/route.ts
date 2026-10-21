import { json } from "@/lib/http";
import { getMenu } from "@/lib/menu";

// The menu as customers see it, including dishes marked sold out
export async function GET(request: Request) {
  void request.headers.get("accept"); // keeps this answer fresh on every visit
  return json({ items: await getMenu() });
}
