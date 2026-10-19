import { json } from "@/lib/http";
import { settlePayment } from "@/lib/payments";
import { paystackConfigured, validSignature } from "@/lib/paystack";

// Paystack calls this by itself when a payment succeeds, even if the customer closed the page.
// Set the address https://YOUR-SITE/api/payments/webhook in the Paystack dashboard.
export async function POST(request: Request) {
  if (!paystackConfigured()) return json({ error: "Payments are not set up." }, 503);

  // The signature is made from the exact text received, so read it as text first
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-paystack-signature"))) {
    return json({ error: "Bad signature." }, 401);
  }

  let event: { event?: string; data?: { reference?: unknown } };
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ ok: true });
  }

  if (event.event === "charge.success" && typeof event.data?.reference === "string") {
    try {
      // We never trust the webhook's own numbers. settlePayment asks Paystack directly.
      await settlePayment(event.data.reference);
    } catch (error) {
      console.error("[payments] webhook could not settle the payment:", error);
      // An error code makes Paystack send it again later
      return json({ error: "Try again." }, 500);
    }
  }
  return json({ ok: true });
}
