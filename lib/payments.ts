import { randomInt } from "crypto";
import {
  findCustomerById,
  getOrder,
  markPaid,
  markPaymentFailed,
  saveNotifications,
  setPaymentReference,
} from "./db";
import type { Customer, Order } from "./db";
import { notifyOrder } from "./notify";
import { initializeTransaction, verifyTransaction } from "./paystack";

// A payment reference looks like TK-4F7K2M-483920: the order number plus a random part.
// Each attempt gets its own reference, because Paystack never accepts a reference twice.
const REFERENCE = /^(TK-[A-Z0-9]{6})-\d{6}$/;

export function orderIdFromReference(reference: string) {
  return REFERENCE.exec(reference)?.[1] ?? null;
}

// Sends the customer to Paystack's payment page
export async function startPayment(order: Order, customer: Customer, origin: string) {
  const reference = `${order.id}-${randomInt(100000, 1000000)}`;
  // Paystack insists on an email. Customers here give a phone number, so one is made up from it.
  const domain = process.env.PAYSTACK_EMAIL_DOMAIN ?? "example.com";

  const transaction = await initializeTransaction({
    email: `${customer.phone}@${domain}`,
    amountKobo: order.total * 100,
    reference,
    callbackUrl: `${origin}/api/payments/callback`,
    metadata: { order_id: order.id },
  });
  await setPaymentReference(order.id, reference);
  return { url: transaction.authorization_url };
}

export type Settled = {
  result: "paid" | "already_paid" | "pending" | "failed" | "mismatch" | "unknown";
  orderId: string | null;
};

// Checks a payment with Paystack and, if it really went through, marks the order paid and
// alerts the restaurant. Safe to call as often as you like: three things call it (the page
// the customer returns to, Paystack's webhook, and the order page), and only the first one
// that sees the money does anything.
export async function settlePayment(reference: string): Promise<Settled> {
  const orderId = orderIdFromReference(reference);
  if (!orderId) return { result: "unknown", orderId: null };

  const order = await getOrder(orderId);
  if (!order || order.paymentMethod !== "online") return { result: "unknown", orderId };
  if (order.paymentStatus === "paid") return { result: "already_paid", orderId };

  const transaction = await verifyTransaction(reference);
  if (transaction.reference !== reference) return { result: "mismatch", orderId };

  if (transaction.status === "failed") {
    await markPaymentFailed(orderId);
    return { result: "failed", orderId };
  }
  // "abandoned" and anything else that is not success: the customer may still pay
  if (transaction.status !== "success") return { result: "pending", orderId };

  // The money must match the order exactly, in naira, whatever the browser claimed
  if (transaction.amount !== order.total * 100 || transaction.currency !== "NGN") {
    console.error(
      `[payments] ${reference}: Paystack reports ${transaction.amount} ${transaction.currency} but the order is ${order.total * 100} NGN kobo. Not marked as paid.`
    );
    return { result: "mismatch", orderId };
  }

  const paidAt = transaction.paid_at ?? new Date().toISOString();
  const changed = await markPaid(orderId, reference, paidAt);
  if (!changed) return { result: "already_paid", orderId };

  // Only the call that flipped the order to paid gets here, so the messages go out once
  const customer = await findCustomerById(order.customerId);
  if (customer) {
    const paidOrder: Order = {
      ...order,
      status: "received",
      paymentStatus: "paid",
      paymentReference: reference,
      paidAt,
    };
    const notifications = await notifyOrder(paidOrder, customer);
    await saveNotifications(orderId, notifications);
  }
  return { result: "paid", orderId };
}
