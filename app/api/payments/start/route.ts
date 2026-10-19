import { currentCustomer } from "@/lib/auth";
import { getOrder } from "@/lib/db";
import { json, readJson, siteOrigin } from "@/lib/http";
import { startPayment } from "@/lib/payments";
import { paystackConfigured } from "@/lib/paystack";
import { tooMany } from "@/lib/rateLimit";

// Starts (or restarts) the payment for one of the customer's own orders
export async function POST(request: Request) {
  const customer = await currentCustomer();
  if (!customer) return json({ error: "Please log in." }, 401);

  const body = await readJson(request);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  if (!orderId) return json({ error: "Invalid request." }, 400);

  if (!paystackConfigured()) {
    return json({ error: "Online payment is not available yet." }, 503);
  }

  const order = await getOrder(orderId);
  if (!order || order.customerId !== customer.id) {
    return json({ error: "Order not found." }, 404);
  }
  if (order.paymentMethod !== "online") {
    return json({ error: "This order is paid on delivery." }, 400);
  }
  if (order.paymentStatus === "paid") {
    return json({ error: "This order is already paid." }, 409);
  }
  if (tooMany(`pay:${order.id}`, 10, 60 * 60 * 1000)) {
    return json({ error: "Too many attempts. Please wait a little and try again." }, 429);
  }

  try {
    const { url } = await startPayment(order, customer, siteOrigin(request));
    return json({ url });
  } catch (error) {
    console.error("[payments] could not start a payment:", error);
    return json({ error: "We could not start the payment. Please try again in a moment." }, 502);
  }
}
