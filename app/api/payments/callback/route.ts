import { siteOrigin } from "@/lib/http";
import { orderIdFromReference, settlePayment } from "@/lib/payments";

// Paystack sends the customer's browser here after they pay (or give up).
// We ask Paystack what really happened, then show the order page.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = siteOrigin(request);
  const reference = url.searchParams.get("reference") ?? url.searchParams.get("trxref") ?? "";

  const orderId = orderIdFromReference(reference);
  if (!orderId) return Response.redirect(`${origin}/menu`, 303);

  try {
    await settlePayment(reference);
  } catch (error) {
    // The order page and the webhook will check again
    console.error("[payments] could not check the payment on return:", error);
  }
  return Response.redirect(`${origin}/order?id=${orderId}`, 303);
}
