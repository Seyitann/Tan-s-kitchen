import { isAdmin } from "@/lib/adminAuth";
import { findCustomersByIds, getOrder, listRecentOrders, updateOrderStatus } from "@/lib/db";
import { json, readJson } from "@/lib/http";
import { isOrderStatus, transitionAllowed } from "@/lib/orderStatus";

// The owner's list of orders, newest first, with each customer's name and phone
export async function GET(request: Request) {
  if (!(await isAdmin())) return json({ error: "Please log in." }, 401);

  const asked = Number(new URL(request.url).searchParams.get("limit"));
  const limit = Math.min(Math.max(Number.isFinite(asked) && asked > 0 ? asked : 100, 1), 200);

  const orders = await listRecentOrders(limit);
  const customers = await findCustomersByIds([...new Set(orders.map((o) => o.customerId))]);
  const byId = new Map(customers.map((c) => [c.id, c]));

  return json({
    orders: orders.map((order) => {
      const customer = byId.get(order.customerId);
      return {
        id: order.id,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentReference: order.paymentReference,
        fulfilment: order.fulfilment,
        address: order.address,
        notes: order.notes,
        items: order.items,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        notifications: order.notifications.map(({ channel, to, status }) => ({ channel, to, status })),
        customer: { name: customer?.name ?? "Unknown", phone: customer?.phone ?? "" },
      };
    }),
  });
}

// Moves one order to its next step, or cancels it
export async function PATCH(request: Request) {
  if (!(await isAdmin())) return json({ error: "Please log in." }, 401);

  const body = await readJson(request);
  const id = typeof body?.id === "string" ? body.id : "";
  const from = body?.from;
  const to = body?.to;
  if (!id || !isOrderStatus(from) || !isOrderStatus(to)) {
    return json({ error: "Invalid request." }, 400);
  }

  const order = await getOrder(id);
  if (!order) return json({ error: "Order not found." }, 404);

  // The owner was looking at an older version of the order
  if (order.status !== from) {
    return json({ error: "This order was changed by someone else. The list has been refreshed." }, 409);
  }
  if (!transitionAllowed(from, order.fulfilment, to)) {
    return json({ error: "That change is not allowed for this order." }, 400);
  }

  const changed = await updateOrderStatus(id, from, to);
  if (!changed) {
    return json({ error: "This order was changed by someone else. The list has been refreshed." }, 409);
  }
  return json({ ok: true });
}
