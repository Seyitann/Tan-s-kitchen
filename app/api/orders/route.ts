import { currentCustomer } from "@/lib/auth";
import { countOrdersSince, createOrder, getOrder, listOrdersForCustomer, saveNotifications } from "@/lib/db";
import { settlePayment } from "@/lib/payments";
import { paystackConfigured } from "@/lib/paystack";
import { json, readJson } from "@/lib/http";
import { getDishes } from "@/lib/menu";
import { notifyOrder } from "@/lib/notify";
import { buildOrder, parseOrderRequest, publicOrder } from "@/lib/orders";

export async function POST(request: Request) {
  const customer = await currentCustomer();
  if (!customer) return json({ error: "Please log in to place an order." }, 401);

  const body = await readJson(request);
  if (!body) return json({ error: "Invalid request." }, 400);

  // At most five orders an hour per account. This counts saved orders, so it holds
  // even when the site runs on many servers at once.
  const lastHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  if ((await countOrdersSince(customer.id, lastHour)) >= 5) {
    return json({ error: "You have placed several orders in the last hour. Please call us for more." }, 429);
  }

  const parsed = parseOrderRequest(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  const { paymentMethod } = parsed.value;
  if (paymentMethod === "online" && !paystackConfigured()) {
    return json({ error: "Online payment is not available yet. Please choose pay on delivery." }, 400);
  }
  if (paymentMethod === "on_delivery" && process.env.ALLOW_PAY_ON_DELIVERY === "false") {
    return json({ error: "Please pay online to place an order." }, 400);
  }

  // Prices and availability come from the live menu, never from the browser
  const dishes = await getDishes(parsed.value.items.map((line) => line.id));
  const built = buildOrder(parsed.value, customer.id, dishes);
  if (!built.ok) return json({ error: built.error }, 400);

  const order = built.order;
  await createOrder(order);

  // An online order is saved but not sent to the restaurant until the payment goes through
  if (order.paymentMethod === "online") {
    return json({ order: publicOrder(order) }, 201);
  }

  // The order is already saved. Messages going wrong never cancel it.
  const notifications = await notifyOrder(order, customer);
  await saveNotifications(order.id, notifications);

  return json({ order: publicOrder({ ...order, notifications }) }, 201);
}

export async function GET(request: Request) {
  const customer = await currentCustomer();
  if (!customer) return json({ error: "Please log in." }, 401);

  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    let order = await getOrder(id);
    // Customers can only open their own orders
    if (!order || order.customerId !== customer.id) {
      return json({ error: "Order not found." }, 404);
    }
    // Looking at an unpaid online order checks with Paystack, in case the customer paid but
    // never came back to the site and the webhook is late
    if (
      order.paymentMethod === "online" &&
      order.paymentStatus !== "paid" &&
      order.paymentReference &&
      paystackConfigured()
    ) {
      try {
        await settlePayment(order.paymentReference);
        order = (await getOrder(id)) ?? order;
      } catch (error) {
        console.error("[payments] could not check the payment:", error);
      }
    }
    return json({ order: publicOrder(order) });
  }

  const orders = await listOrdersForCustomer(customer.id);
  return json({ orders: orders.map(publicOrder) });
}
