"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Bell, BellOff, LogOut, MapPin, MessageCircle, Phone } from "lucide-react";
import { naira } from "@/lib/format";
import { canCancel, nextStatus, statusLabel } from "@/lib/orderStatus";
import type { OrderStatus } from "@/lib/orderStatus";
import { displayPhone } from "@/lib/phone";
import { charcoal, curved, curvedSm, dark, solid } from "./buttonStyles";

type AdminOrder = {
  id: string;
  status: OrderStatus;
  paymentMethod: "online" | "on_delivery";
  paymentStatus: "unpaid" | "paid" | "failed";
  paymentReference: string | null;
  fulfilment: "delivery" | "pickup";
  address: string;
  notes: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  paidAt: string | null;
  customer: { name: string; phone: string };
};

type Tab = "new" | "progress" | "done" | "cancelled" | "unpaid";

const tabs: { key: Tab; label: string; match: (status: OrderStatus) => boolean }[] = [
  { key: "new", label: "New", match: (s) => s === "received" },
  {
    key: "progress",
    label: "In progress",
    match: (s) => s === "preparing" || s === "on_the_way" || s === "ready",
  },
  { key: "done", label: "Completed", match: (s) => s === "completed" },
  { key: "cancelled", label: "Cancelled", match: (s) => s === "cancelled" },
  { key: "unpaid", label: "Unpaid", match: (s) => s === "awaiting_payment" },
];

// The text on the button that moves an order forward
const nextLabel: Partial<Record<OrderStatus, string>> = {
  preparing: "Start preparing",
  on_the_way: "Out for delivery",
  ready: "Ready for pickup",
  completed: "Mark completed",
};

const field =
  "w-full rounded-[0.5rem] border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-orange-500 focus:outline-none";

// Three short beeps made by the browser itself, so no sound file is needed
function beep() {
  try {
    const Context =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new Context();
    [0, 0.28, 0.56].forEach((delay) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + delay;
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.4, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.25);
    });
    setTimeout(() => void context.close(), 1500);
  } catch {
    // No sound available. The orders still show up.
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setPassword("");
      onDone();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-[0.8rem] rounded-tr-[2rem] border border-white/10 bg-stone-900/60 p-8">
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold">
        Owner login
      </h1>
      <p className="mt-2 text-sm text-stone-400">See and manage incoming orders.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          className={field}
          type="password"
          placeholder="Password"
          aria-label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p role="alert" className="text-sm text-orange-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className={`${curved} ${solid} w-full py-3 text-sm font-extrabold uppercase tracking-wide disabled:opacity-60`}
        >
          {busy ? "Please wait..." : "Log in"}
        </button>
      </form>
    </div>
  );
}

function badgeFor(order: AdminOrder) {
  if (order.paymentStatus === "paid") {
    return { text: "Paid online", style: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" };
  }
  if (order.paymentMethod === "online") {
    return {
      text: order.paymentStatus === "failed" ? "Payment failed" : "Awaiting payment",
      style: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    };
  }
  return { text: "Pay on delivery", style: "border-stone-500/50 bg-stone-500/15 text-stone-300" };
}

function OrderCard({
  order,
  busy,
  onChange,
}: {
  order: AdminOrder;
  busy: boolean;
  onChange: (order: AdminOrder, to: OrderStatus) => void;
}) {
  const badge = badgeFor(order);
  const next = nextStatus(order.status, order.fulfilment);
  const phone = order.customer.phone;

  return (
    <article className="rounded-[0.8rem] rounded-tr-[2rem] border border-white/10 bg-stone-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-lg font-bold">{order.id}</p>
          <p className="text-xs text-stone-400">{formatTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-extrabold uppercase tracking-wide">
          <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-3 py-1 text-orange-300">
            {statusLabel[order.status]}
          </span>
          <span className={`rounded-full border px-3 py-1 ${badge.style}`}>{badge.text}</span>
          <span className="rounded-full border border-stone-500/50 bg-stone-500/15 px-3 py-1 text-stone-300">
            {order.fulfilment}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="font-semibold">{order.customer.name}</span>
        {phone && (
          <>
            <a
              href={`tel:+${phone}`}
              className="inline-flex items-center gap-1 text-orange-300 hover:text-orange-200"
            >
              <Phone className="h-4 w-4" />
              {displayPhone(phone)}
            </a>
            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-orange-300 hover:text-orange-200"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </>
        )}
      </div>

      <ul className="mt-4 space-y-1 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4">
            <span>
              <span className="font-bold">{item.quantity} x</span> {item.name}
            </span>
            <span className="text-stone-400">{naira.format(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="mt-3 rounded-[0.5rem] border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Note: {order.notes}
        </p>
      )}

      {order.fulfilment === "delivery" && order.address && (
        <p className="mt-3 flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
          <span>
            {order.address}{" "}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-300 underline hover:text-orange-200"
            >
              Open in Maps
            </a>
          </span>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <p className="text-sm text-stone-300">
          Total <span className="text-lg font-bold text-orange-400">{naira.format(order.total)}</span>
          {order.deliveryFee > 0 && (
            <span className="text-xs text-stone-500"> (includes {naira.format(order.deliveryFee)} delivery)</span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {next && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onChange(order, next)}
              className={`${curved} ${solid} px-6 py-2.5 text-xs font-extrabold uppercase tracking-wide disabled:opacity-60`}
            >
              {nextLabel[next]}
            </button>
          )}
          {canCancel(order.status) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onChange(order, "cancelled")}
              className={`${curved} ${charcoal} px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide disabled:opacity-60`}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {order.status === "awaiting_payment" && (
        <p className="mt-3 text-xs text-stone-500">
          The customer has not paid yet. Do not start cooking. You will not be alerted until the payment goes through.
        </p>
      )}
      {order.paymentStatus === "paid" && order.paymentReference && (
        <p className="mt-3 text-xs text-stone-500">
          Paystack reference: {order.paymentReference}
        </p>
      )}
    </article>
  );
}

export default function AdminView() {
  const [auth, setAuth] = useState<"checking" | "out" | "in">("checking");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [tab, setTab] = useState<Tab>("new");
  const [sound, setSound] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const soundOn = useRef(false);
  const previousNew = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/orders?limit=150", { cache: "no-store" });
      if (response.status === 401) {
        setAuth("out");
        return;
      }
      if (!response.ok) throw new Error("Bad response");
      const data = (await response.json()) as { orders: AdminOrder[] };

      // A new order has arrived since the last check
      const newCount = data.orders.filter((o) => o.status === "received").length;
      if (previousNew.current !== null && newCount > previousNew.current && soundOn.current) {
        beep();
      }
      previousNew.current = newCount;

      setOrders(data.orders);
      setAuth("in");
      setUpdatedAt(new Date());
      setLoadError("");
    } catch {
      setLoadError("Could not reach the server. Trying again...");
    }
  }, []);

  // Look for new orders every 10 seconds while logged in
  const polling = auth !== "out";
  useEffect(() => {
    if (!polling) return;
    const first = setTimeout(() => void load(), 0);
    const timer = setInterval(() => void load(), 10000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [polling, load]);

  const counts = useMemo(() => {
    const result: Record<Tab, number> = { new: 0, progress: 0, done: 0, cancelled: 0, unpaid: 0 };
    for (const order of orders) {
      const tabFor = tabs.find((t) => t.match(order.status));
      if (tabFor) result[tabFor.key] += 1;
    }
    return result;
  }, [orders]);

  // The browser tab shows how many new orders are waiting
  useEffect(() => {
    document.title =
      auth === "in" && counts.new > 0
        ? `(${counts.new}) New orders | Tan's Kitchen`
        : "Orders | Tan's Kitchen";
  }, [auth, counts.new]);

  function toggleSound() {
    const next = !sound;
    soundOn.current = next;
    setSound(next);
    // Plays once so you hear what it sounds like. This also lets the browser play it later.
    if (next) beep();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    previousNew.current = null;
    setOrders([]);
    setAuth("out");
  }

  async function changeStatus(order: AdminOrder, to: OrderStatus) {
    if (
      to === "cancelled" &&
      !window.confirm(
        `Cancel order ${order.id}?${
          order.paymentStatus === "paid"
            ? " The customer paid online, so refund them from the Paystack dashboard."
            : ""
        }`
      )
    ) {
      return;
    }
    setBusyId(order.id);
    setActionError("");
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, from: order.status, to }),
      });
      if (response.status === 401) {
        setAuth("out");
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setActionError(data?.error ?? "That did not work. Please try again.");
      }
    } catch {
      setActionError("Could not reach the server. Check your connection and try again.");
    } finally {
      await load();
      setBusyId(null);
    }
  }

  if (auth === "checking") {
    return <p className="py-20 text-center text-stone-400">Loading...</p>;
  }

  if (auth === "out") {
    return <LoginForm onDone={() => setAuth("checking")} />;
  }

  const visible = orders.filter((o) => tabs.find((t) => t.key === tab)?.match(o.status));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold">Orders</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            className={`${curvedSm} ${dark} inline-flex items-center gap-2 px-4 py-2 text-xs font-extrabold uppercase tracking-wide`}
          >
            {sound ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            Sound {sound ? "on" : "off"}
          </button>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            title="Log out"
            className={`${curvedSm} ${dark} grid h-9 w-9 place-items-center`}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-stone-500">
        {updatedAt ? `Updated ${updatedAt.toLocaleTimeString("en-NG")}. ` : ""}
        This page checks for new orders every 10 seconds. Keep it open, and turn the sound on so you hear new ones.
      </p>
      {loadError && <p className="mt-2 text-sm text-orange-400">{loadError}</p>}
      {actionError && (
        <p role="alert" className="mt-2 text-sm text-orange-400">
          {actionError}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`${curved} px-5 py-2 text-xs font-extrabold uppercase tracking-wide ${
              tab === t.key ? solid : charcoal
            }`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {visible.length === 0 ? (
          <p className="py-16 text-center text-stone-400">Nothing here right now.</p>
        ) : (
          visible.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              busy={busyId === order.id}
              onChange={changeStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}
