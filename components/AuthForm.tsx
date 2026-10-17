"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useSession } from "@/lib/session";
import { curved, solid } from "./buttonStyles";

const field =
  "w-full rounded-[0.5rem] border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-orange-500 focus:outline-none";

export default function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();

  // Where to go after logging in. Only pages on this site are allowed.
  const next = params.get("next") ?? "/menu";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/menu";

  const status = useSession((state) => state.status);
  const user = useSession((state) => state.user);
  const setUser = useSession((state) => state.setUser);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Already logged in? Carry straight on.
  useEffect(() => {
    if (status === "ready" && user) router.replace(safeNext);
  }, [status, user, safeNext, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setUser(data.user);
      router.push(safeNext);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const tab = (value: "login" | "register", label: string) => (
    <button
      type="button"
      onClick={() => {
        setMode(value);
        setError("");
      }}
      className={`flex-1 border-b-2 pb-3 text-sm font-extrabold uppercase tracking-wide transition-colors ${
        mode === value
          ? "border-orange-500 text-white"
          : "border-transparent text-stone-500 hover:text-stone-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <motion.div
      className="w-full rounded-[0.8rem] rounded-tr-[2rem] border border-white/10 bg-stone-900/60 p-8"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-stone-400">
        Log in to place your order. We send updates to your phone.
      </p>

      <div className="mt-6 flex border-b border-stone-800">
        {tab("login", "Log in")}
        {tab("register", "Create account")}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "register" && (
          <input
            className={field}
            placeholder="Your name"
            aria-label="Your name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <div>
          <input
            className={field}
            type="tel"
            inputMode="tel"
            placeholder="Phone number, like 0803 123 4567"
            aria-label="Phone number"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          {mode === "register" && (
            <p className="mt-1 text-xs text-stone-500">
              Order updates are sent to this number by SMS and WhatsApp.
            </p>
          )}
        </div>
        <input
          className={field}
          type="password"
          placeholder={mode === "register" ? "Password (at least 8 characters)" : "Password"}
          aria-label="Password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
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
          {busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
    </motion.div>
  );
}
