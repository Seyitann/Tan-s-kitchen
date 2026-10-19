import { json } from "@/lib/http";
import { paystackConfigured } from "@/lib/paystack";

// Tells the checkout page which ways of paying are switched on.
// Reading something from the request keeps this answer fresh on every visit
// instead of being worked out once when the site is built.
export async function GET(request: Request) {
  void request.headers.get("accept");
  return json({
    online: paystackConfigured(),
    onDelivery: process.env.ALLOW_PAY_ON_DELIVERY !== "false",
  });
}
