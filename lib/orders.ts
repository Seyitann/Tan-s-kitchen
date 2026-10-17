import { randomInt } from "crypto";
import { menu } from "@/data/menu";
import { DELIVERY_FEE, MAX_QUANTITY_PER_ITEM } from "./config";
import type { Order } from "./db";

type Parsed =
  | {
      ok: true;
      value: {
        items: { id: string; quantity: number }[];
        fulfilment: "delivery" | "pickup";
        address: string;
        notes: string;
      };
    }
  | { ok: false; error: string };

// Checks what the browser sent. Anything it says about prices is ignored on purpose.
export function parseOrderRequest(body: Record<string, unknown>): Parsed {
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const quantities = new Map<string, number>();

  for (const raw of rawItems) {
    const { id, quantity } = (raw ?? {}) as { id?: unknown; quantity?: unknown };
    if (
      typeof id !== "string" ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return { ok: false, error: "Something is wrong with your cart. Please refresh and try again." };
    }
    quantities.set(id, (quantities.get(id) ?? 0) + quantity);
  }

  if (quantities.size === 0) return { ok: false, error: "Your cart is empty." };
  if (quantities.size > 30) return { ok: false, error: "That is too many different dishes for one order." };
  for (const quantity of quantities.values()) {
    if (quantity > MAX_QUANTITY_PER_ITEM) {
      return { ok: false, error: `You can order at most ${MAX_QUANTITY_PER_ITEM} of one dish. For bigger orders, please call us.` };
    }
  }

  const fulfilment = body.fulfilment === "pickup" ? "pickup" : "delivery";
  const address = String(body.address ?? "").trim().replace(/\s+/g, " ");
  const notes = String(body.notes ?? "").trim().replace(/\s+/g, " ");

  if (fulfilment === "delivery" && (address.length < 5 || address.length > 200)) {
    return { ok: false, error: "Please enter your delivery address." };
  }
  if (notes.length > 300) {
    return { ok: false, error: "Please keep the note under 300 characters." };
  }

  return {
    ok: true,
    value: {
      items: [...quantities].map(([id, quantity]) => ({ id, quantity })),
      fulfilment,
      address: fulfilment === "delivery" ? address : "",
      notes,
    },
  };
}

const ID_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newOrderId() {
  let code = "";
  for (let i = 0; i < 6; i++) code += ID_LETTERS[randomInt(ID_LETTERS.length)];
  return `TK-${code}`;
}

// Works out the prices from the menu on the server, never from the browser
export function buildOrder(
  request: Extract<Parsed, { ok: true }>["value"],
  customerId: string
): { ok: true; order: Order } | { ok: false; error: string } {
  const items = [];
  for (const line of request.items) {
    const dish = menu.find((item) => item.id === line.id);
    if (!dish) {
      return { ok: false, error: "A dish in your cart is no longer on the menu. Please refresh and try again." };
    }
    items.push({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      quantity: line.quantity,
    });
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = request.fulfilment === "delivery" ? DELIVERY_FEE : 0;

  return {
    ok: true,
    order: {
      id: newOrderId(),
      customerId,
      items,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      fulfilment: request.fulfilment,
      address: request.address,
      notes: request.notes,
      status: "received",
      createdAt: new Date().toISOString(),
      notifications: [],
    },
  };
}

// What the browser is allowed to see about an order
export function publicOrder(order: Order) {
  const { customerId: _customerId, notifications, ...rest } = order;
  void _customerId;
  return {
    ...rest,
    notifications: notifications.map(({ channel, to, status }) => ({
      channel,
      to,
      status,
    })),
  };
}
