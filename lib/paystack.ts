import { createHmac, timingSafeEqual } from "crypto";

// Talks to Paystack (https://paystack.com), which takes the card, bank transfer or
// USSD payment on its own secure page. Card details never touch this website.

function baseUrl() {
  return (process.env.PAYSTACK_BASE_URL ?? "https://api.paystack.co").replace(/\/$/, "");
}

export function paystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  const json = (await response.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: T;
  } | null;
  if (!response.ok || !json || json.status !== true || json.data === undefined) {
    throw new Error(`Paystack error (${response.status}): ${json?.message ?? "no message"}`);
  }
  return json.data;
}

// Starts a payment. Amounts go to Paystack in kobo: 100 kobo is 1 naira.
export async function initializeTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}) {
  const data = await call<{ authorization_url: string; reference: string }>(
    "/transaction/initialize",
    {
      method: "POST",
      body: {
        email: input.email,
        amount: input.amountKobo,
        currency: "NGN",
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      },
    }
  );
  return data;
}

// Asks Paystack directly what happened to a payment. This is the only thing we trust.
export function verifyTransaction(reference: string) {
  return call<{
    status: string; // "success", "failed", "abandoned", ...
    reference: string;
    amount: number; // kobo
    currency: string;
    paid_at: string | null;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

// Paystack signs every webhook with your secret key. Anything unsigned is rejected.
export function validSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = createHmac("sha512", secretKey()).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
