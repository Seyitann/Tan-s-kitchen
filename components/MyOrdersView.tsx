"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import type { MenuItem } from "@/lib/menuTypes";
import { naira } from "@/lib/format";
import { statusLabel } from "@/lib/orderStatus";
import type { OrderStatus } from "@/lib/orderStatus";
import { useSession } from "@/lib/session";
import StatusSteps from "./StatusSteps";
import { curved, solid, soft } from "./buttonStyles";

type MyOrder = {
  id: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  total: number;
  fulfilment: "delivery" | "pickup";
  status: OrderStatus;
  paymentMethod: "online" | "on_delivery";
  paymentStatus: "unpaid" | "paid" | "failed";
  createdAt: string;
};

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; orders: MyOrder[] };

const badgeStyle: Record<OrderStatus, string> = {
  awaiting_payment: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  received: "border-orange-500/40 bg-orange-500/15 text-orange-300",
  preparing: "border-orange-500/40 bg-orange-500/15 text-orange-300",
  on_the_way: "border-orange-500/40 bg-orange-500/15 text-orange-300",
  ready: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  completed: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  cancelled: "border-stone-500/50 bg-stone-500/15 text-stone-400",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function paymentText(order: MyOrder) {
  if (order.paymentStatus === "paid") return "Paid online";
  if (order.paymentMethod === "online") {
    return order.paymentStatus === "failed" ? "Payment did not go through" : "Waiting for payment";
  }
  return "Pay on delivery";
}

function summary(order: MyOrder) {
  const lines = order.items.map((i) => `${i.quantity} x ${i.name}`);
  const shown = lines.slice(0, 2).join(", ");
  return lines.length > 2 ? `${shown} and ${lines.length - 2} more` : shown;
}

export default function MyOrdersView() {
  const router = useRouter();
  const status = useSession((state) => state.status);
  const user = useSession((state) => state.user);
  const addToCart = useCart((state) => state.add);
  const openCart = useCart((state) => state.open);

  const [state, setState] = useState<State>({ kind: "loading" });
  const [refreshKey, setRefreshKey] = useState(0);
  const [notice, setNotice] = useState("");

  // Orders need a login
  useEffect(() => {
    if (status === "ready" && !user) router.replace("/login?next=/orders");
  }, [status, user, router]);

  useEffect(() => {
    if (status !== "ready" || !user) return;
    let cancelled = false;
    fetch("/api/orders", { cache: "no-store" })
      .then(async (response) => ({ ok: response.ok, data: await response.json() }))
      .then(({ ok, data }) => {
        if (cancelled) return;
        setState(
          ok
            ? { kind: "ready", orders: data.orders }
            : { kind: "error", message: data.error ?? "We could not load your orders." }
        );
      })
      .catch(() => {
        if (!cancelled) {
          setState({ kind: "error", message: "Could not reach the server. Please try again." });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status, user, refreshKey]);

  // While any order is still on its way, check for new statuses every 20 seconds
  const anyInProgress =
    state.kind === "ready" &&
    state.orders.some((o) => o.status !== "completed" && o.status !== "cancelled");
  useEffect(() => {
    if (!anyInProgress) return;
    let checks = 0;
    const timer = setInterval(() => {
      checks += 1;
      if (checks > 90) {
        clearInterval(timer);
        return;
      }
      setRefreshKey((key) => key + 1);
    }, 20000);
    return () => clearInterval(timer);
  }, [anyInProgress]);

  // Puts the same dishes back in the cart, at today's prices and only if they are available
  async function orderAgain(order: MyOrder) {
    let dishes: MenuItem[];
    try {
      const response = await fetch("/api/menu", { cache: "no-store" });
      dishes = (await response.json()).items;
    } catch {
      setNotice("Could not reach the menu. Please try again.");
      return;
    }

    let skipped = 0;
    for (const line of order.items) {
      const dish = dishes.find((d) => d.id === line.id);
      if (!dish || !dish.available) {
        skipped += 1;
        continue;
      }
      for (let i = 0; i < line.quantity; i++) addToCart(dish);
    }
    setNotice(
      skipped > 0
        ? "Some dishes from that order are sold out or no longer on the menu, so they were left out."
        : ""
    );
    openCart();
  }

  if (status !== "ready" || !user || state.kind === "loading") {
    return <p className="py-20 text-center text-stone-400">Loading your orders...</p>;
  }

  if (state.kind === "error") {
    return (
      <div className="py-20 text-center">
        <p className="text-stone-300">{state.message}</p>
        <button
          type="button"
          onClick={() => setRefreshKey((key) => key + 1)}
          className={`${curved} ${soft} mt-6 px-8 py-2.5 text-xs font-extrabold uppercase tracking-wide`}
        >
          Try again
        </button>
      </div>
    );
  }

  if (state.orders.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-stone-300">You have not placed any orders yet.</p>
        <Link
          href="/menu"
          className={`${curved} ${solid} mt-6 inline-block px-8 py-2.5 text-xs font-extrabold uppercase tracking-wide`}
        >
          Browse the menu
        </Link>
      </div>
    );
  }

  return (
    <div>
      {notice && (
        <p role="status" className="mb-4 text-sm text-orange-400">
          {notice}
        </p>
      )}
      <ul className="space-y-4">
        {state.orders.map((order) => (
          <li
            key={order.id}
            className="rounded-[0.8rem] rounded-tr-[2rem] border border-white/10 bg-stone-900/60 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link
                  href={`/order?id=${encodeURIComponent(order.id)}`}
                  className="text-lg font-bold hover:text-orange-300"
                >
                  {order.id}
                </Link>
                <p className="text-xs text-stone-400">{formatTime(order.createdAt)}</p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${badgeStyle[order.status]}`}
              >
                {statusLabel[order.status]}
              </span>
            </div>

            <p className="mt-3 text-sm text-stone-300">{summary(order)}</p>
            <p className="mt-1 text-xs text-stone-500">
              {order.fulfilment === "delivery" ? "Delivery" : "Pickup"} &middot; {paymentText(order)}
            </p>

            {order.status === "awaiting_payment" ? (
              <p className="mt-4 text-sm text-amber-300">
                We have not received the payment yet.{" "}
                <Link
                  href={`/order?id=${encodeURIComponent(order.id)}`}
                  className="underline hover:text-amber-200"
                >
                  Pay now
                </Link>
              </p>
            ) : (
              <div className="mt-4">
                <StatusSteps status={order.status} fulfilment={order.fulfilment} />
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-sm text-stone-300">
                Total{" "}
                <span className="text-lg font-bold text-orange-400">{naira.format(order.total)}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/order?id=${encodeURIComponent(order.id)}`}
                  className={`${curved} ${soft} px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide`}
                >
                  View details
                </Link>
                <button
                  type="button"
                  onClick={() => orderAgain(order)}
                  className={`${curved} ${solid} px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide`}
                >
                  Order again
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
