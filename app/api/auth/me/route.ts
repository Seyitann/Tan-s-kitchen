import { currentCustomer, publicUser } from "@/lib/auth";
import { json } from "@/lib/http";

export async function GET() {
  const customer = await currentCustomer();
  return json({ user: customer ? publicUser(customer) : null });
}
