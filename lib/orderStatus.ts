// The steps an order goes through. Shared by the owner page, the customer's order page
// and the server, so they always agree on the rules.

export type OrderStatus =
  | "awaiting_payment" // paid online orders wait here until the payment is confirmed
  | "received"
  | "preparing"
  | "on_the_way" // delivery orders
  | "ready" // pickup orders
  | "completed"
  | "cancelled";

export const statusLabel: Record<OrderStatus, string> = {
  awaiting_payment: "Waiting for payment",
  received: "Received",
  preparing: "Being prepared",
  on_the_way: "On the way",
  ready: "Ready for pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

const all = Object.keys(statusLabel) as OrderStatus[];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && all.includes(value as OrderStatus);
}

// The one step forward from each status. Delivery and pickup finish differently.
export function nextStatus(
  status: OrderStatus,
  fulfilment: "delivery" | "pickup"
): OrderStatus | null {
  switch (status) {
    case "received":
      return "preparing";
    case "preparing":
      return fulfilment === "delivery" ? "on_the_way" : "ready";
    case "on_the_way":
    case "ready":
      return "completed";
    default:
      return null;
  }
}

// Unpaid online orders cannot be cancelled: a payment could still arrive for them
export function canCancel(status: OrderStatus) {
  return (
    status === "received" ||
    status === "preparing" ||
    status === "on_the_way" ||
    status === "ready"
  );
}

export function transitionAllowed(
  from: OrderStatus,
  fulfilment: "delivery" | "pickup",
  to: OrderStatus
) {
  return to === nextStatus(from, fulfilment) || (to === "cancelled" && canCancel(from));
}