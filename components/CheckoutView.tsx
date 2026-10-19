"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { selectTotal, useCart } from "@/lib/cart";
import { DELIVERY_FEE } from "@/lib/config";
import { naira } from "@/lib/format";
import { displayPhone } from "@/lib/phone";
import { useSession } from "@/lib/session";
import { charcoal, curved, solid } from "./buttonStyles";

type PaymentMethod = "online" | "on_delivery";
type Options = { online: boolean; onDelivery: boolean };

const field =
  "w-full rounded-[0.5rem] border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-orange-500 focus:outline-none";

const methodLabel: Record<PaymentMethod, string> = {
  online: "Pay now",
  on_delivery: "Pay on delivery",
};

export default function CheckoutView() {
  const router = useRouter();
  const status = useSession((state) => state.status);
  const user = useSession((state) => state.user);
  const hydrated = useCart((state) => state.hydrated);
  const lines = useCart((state) => state.lines);
  const subtotal = useCart(selectTotal);
  const clear = useCart((state) => state.clear);
  const openCart = useCart((state) => state.open);

  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [options, setOptions] = useState<Options | null>(null);
  const [chosen, setChosen] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Ordering needs a login
  useEffect(() => {
    if (status === "ready" && !user) router.replace("/login?next=/checkout");
  }, [status, user, router]);

  // Which ways of paying are switched on
  useEffect(() => {
    let cancelled = false;
    fetch("/api/payments/options", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: Options) => {
        if (!cancelled) setOptions(data);
      })
      .catch(() => {
        if (!cancelled) setOptions({ online: false, onDelivery: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const available: PaymentMethod[] = options
    ? [
        ...(options.online ? (["online"] as const) : []),
        ...(options.onDelivery ? (["on_delivery"] as const) : []),
      ]
    : [];
  const method = chosen && available.includes(chosen) ? chosen : (available[0] ?? null);

  const fee = fulfilment === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + fee;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!method) return;
    setError("");
    setBusy(true);
    try {
      // Only dish ids and quantities are sent. The server works out the prices itself.
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((line) => ({ id: line.id, quantity: line.quantity })),
          fulfilment,
          address,
          notes,
          paymentMethod: method,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      const orderId: string = data.order.id;
      setRedirecting(true);
      clear();

      if (method === "online") {
        // Straight on to Paystack's payment page
        const pay = await fetch("/api/payments/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const payData = await pay.json().catch(() => null);
        if (pay.ok && payData?.url) {
          window.location.assign(payData.url);
          return;
        }
        // If the payment page could not open, the order page has a "Pay now" button to try again
      }
      router.push(`/order?id=${encodeURIComponent(orderId)}`);
    } catch {
      setRedirecting(false);
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (redirecting) {
    return <p className="py-20 text-center text-stone-300">Taking you to the next step...</p>;
  }

  if (status !== "ready" || !hydrated || !user || !options) {
    return <p className="py-20 text-center text-stone-400">Loading your order...</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-stone-300">Your cart is empty.</p>
        <Link
          href="/menu"
          className={`${curved} ${solid} mt-6 inline-block px-8 py-2.5 text-xs font-extrabold uppercase tracking-wide`}
        >
          Browse the menu
        </Link>
      </div>
    );
  }

  if (!method) {
    return (
      <p className="py-20 text-center text-stone-300">
        Ordering is switched off right now. Please try again later.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 md:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-stone-400">
            Your details
          </h2>
          <p className="mt-2">
            {user.name}, {displayPhone(user.phone)}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Order updates are sent to this number by SMS and WhatsApp.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-stone-400">
            How do you want it?
          </h2>
          <div className="mt-3 flex gap-3">
            {(["delivery", "pickup"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFulfilment(option)}
                className={`${curved} px-7 py-2.5 text-xs font-extrabold uppercase tracking-wide ${
                  fulfilment === option ? solid : charcoal
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {fulfilment === "delivery" && (
          <div>
            <label htmlFor="address" className="text-sm font-extrabold uppercase tracking-wide text-stone-400">
              Delivery address
            </label>
            <textarea
              id="address"
              className={`${field} mt-3`}
              rows={3}
              placeholder="House number, street, area, and a landmark if you can"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="notes" className="text-sm font-extrabold uppercase tracking-wide text-stone-400">
            Note for the kitchen (optional)
          </label>
          <textarea
            id="notes"
            className={`${field} mt-3`}
            rows={2}
            placeholder="For example: no pepper, extra stew"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-stone-400">
            How do you want to pay?
          </h2>
          {available.length > 1 && (
            <div className="mt-3 flex gap-3">
              {available.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setChosen(option)}
                  className={`${curved} px-7 py-2.5 text-xs font-extrabold uppercase tracking-wide ${
                    method === option ? solid : charcoal
                  }`}
                >
                  {methodLabel[option]}
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-stone-500">
            {method === "online"
              ? "Pay with your card, a bank transfer or USSD on Paystack's secure page. The restaurant is alerted as soon as your payment goes through."
              : "You pay when your order arrives."}
          </p>
        </div>
      </div>

      <aside className="h-fit rounded-[0.8rem] rounded-tr-[2rem] border border-white/10 bg-stone-900/60 p-6">
        <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold">
          Your order
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          {lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-4">
              <span className="text-stone-300">
                {line.quantity} x {line.name}
              </span>
              <span>{naira.format(line.price * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={openCart}
          className="mt-3 text-xs text-stone-400 underline hover:text-white"
        >
          Change items
        </button>

        <div className="mt-5 space-y-1 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between text-stone-300">
            <span>Subtotal</span>
            <span>{naira.format(subtotal)}</span>
          </div>
          {fulfilment === "delivery" && (
            <div className="flex justify-between text-stone-300">
              <span>Delivery fee</span>
              <span>{naira.format(fee)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 text-lg font-bold">
            <span>Total</span>
            <span className="text-orange-400">{naira.format(total)}</span>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-orange-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className={`${curved} ${solid} mt-5 w-full py-3 text-sm font-extrabold uppercase tracking-wide disabled:opacity-60`}
        >
          {busy
            ? "Please wait..."
            : method === "online"
              ? `Pay ${naira.format(total)}`
              : "Place order"}
        </button>
      </aside>
    </form>
  );
}
