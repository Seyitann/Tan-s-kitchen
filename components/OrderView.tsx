"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { naira } from "@/lib/format";
import { useSession } from "@/lib/session";
import { curved, solid, soft } from "./buttonStyles";

type PublicOrder = {
  id: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfilment: "delivery" | "pickup";
  address: string;
  notes: string;
  notifications: {
    channel: "sms" | "whatsapp";
    to: "restaurant" | "customer";
    status: "sent" | "failed" | "skipped" | "logged";
  }[];
};

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; order: PublicOrder };

const statusText = {
  sent: "Sent",
  failed: "Could not be sent",
  skipped: "Not set up yet",
  logged: "Test mode, not really sent",
};

// The restaurant's WhatsApp number, digits only with country code, set in .env.local
const restaurantWhatsApp = process.env.NEXT_PUBLIC_RESTAURANT_WHATSAPP;

export default function OrderView() {
  const id = useSearchParams().get("id");
  const status = useSession((state) => state.status);
  const user = useSession((state) => state.user);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!id || status !== "ready" || !user) return;
    let cancelled = false;
    fetch(`/api/orders?id=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => ({ ok: response.ok, data: await response.json() }))
      .then(({ ok, data }) => {
        if (cancelled) return;
        setState(
          ok
            ? { kind: "ready", order: data.order }
            : { kind: "error", message: data.error ?? "We could not find that order." }
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
  }, [id, status, user]);

  if (!id) {
    return <p className="py-20 text-center text-stone-400">No order selected.</p>;
  }

  if (status === "ready" && !user) {
    return (
      <div className="py-20 text-center">
        <p className="text-stone-300">Please log in to see your order.</p>
        <Link
          href={`/login?next=${encodeURIComponent(`/order?id=${id}`)}`}
          className={`${curved} ${solid} mt-6 inline-block px-8 py-2.5 text-xs font-extrabold uppercase tracking-wide`}
        >
          Log in
        </Link>
      </div>
    );
  }

  if (state.kind === "loading") {
    return <p className="py-20 text-center text-stone-400">Loading your order...</p>;
  }

  if (state.kind === "error") {
    return (
      <div className="py-20 text-center">
        <p className="text-stone-300">{state.message}</p>
        <Link
          href="/menu"
          className={`${curved} ${soft} mt-6 inline-block px-8 py-2.5 text-xs font-extrabold uppercase tracking-wide`}
        >
          Back to the menu
        </Link>
      </div>
    );
  }

  const { order } = state;
  const find = (channel: "sms" | "whatsapp", to: "restaurant" | "customer") =>
    order.notifications.find((n) => n.channel === channel && n.to === to);
  const restaurantAlerted = ["sms", "whatsapp"].some(
    (channel) => find(channel as "sms" | "whatsapp", "restaurant")?.status === "sent"
  );

  const whatsAppText = [
    `Hello Tan's Kitchen, I just placed order ${order.id}.`,
    order.items.map((i) => `${i.quantity} x ${i.name}`).join(", ") + ".",
    `Total: ${naira.format(order.total)}.`,
    order.fulfilment === "delivery" ? `Deliver to: ${order.address}.` : "Pickup.",
  ].join(" ");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-9 w-9 text-orange-400" />
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold">
          Order placed
        </h1>
      </div>
      <p className="mt-3 text-stone-300">
        Your order number is <span className="font-bold text-white">{order.id}</span>.
        {restaurantAlerted && " Tan's Kitchen has been alerted and is on it."}
      </p>

      <div className="mt-8 rounded-[0.8rem] rounded-tr-[2rem] border border-white/10 bg-stone-900/60 p-6">
        <ul className="space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span className="text-stone-300">
                {item.quantity} x {item.name}
              </span>
              <span>{naira.format(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-white/10 pt-4 text-sm">
          {order.deliveryFee > 0 && (
            <div className="flex justify-between text-stone-300">
              <span>Delivery fee</span>
              <span>{naira.format(order.deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-orange-400">{naira.format(order.total)}</span>
          </div>
        </div>
        <p className="mt-4 text-sm text-stone-400">
          {order.fulfilment === "delivery" ? `Delivery to: ${order.address}` : "Pickup"}
          {order.notes && <> &middot; Note: {order.notes}</>}
        </p>
        <p className="mt-2 text-xs text-stone-500">You pay when your order arrives.</p>
      </div>

      <div className="mt-6 text-sm text-stone-400">
        <p>
          SMS confirmation to you:{" "}
          <span className="text-stone-200">{statusText[find("sms", "customer")?.status ?? "skipped"]}</span>
        </p>
        <p className="mt-1">
          WhatsApp confirmation to you:{" "}
          <span className="text-stone-200">{statusText[find("whatsapp", "customer")?.status ?? "skipped"]}</span>
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {restaurantWhatsApp && (
          <a
            href={`https://wa.me/${restaurantWhatsApp}?text=${encodeURIComponent(whatsAppText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${curved} ${solid} inline-flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold uppercase tracking-wide`}
          >
            <MessageCircle className="h-4 w-4" />
            Message us on WhatsApp
          </a>
        )}
        <Link
          href="/menu"
          className={`${curved} ${soft} inline-block px-6 py-2.5 text-xs font-extrabold uppercase tracking-wide`}
        >
          Back to the menu
        </Link>
      </div>
    </div>
  );
}
