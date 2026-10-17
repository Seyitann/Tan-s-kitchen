import { normalizeNgPhone } from "./phone";
import {
  customerSms,
  customerWhatsAppData,
  restaurantSms,
  restaurantWhatsAppData,
} from "./messages";
import type { Customer, Notification, Order } from "./db";

// Sends order messages through Termii (https://termii.com), a Nigerian messaging service.
// With no TERMII_API_KEY set, nothing is sent. The messages are printed in the terminal
// instead, so you can test the whole ordering flow for free.

type Who = Notification["to"];

function termii() {
  const apiKey = process.env.TERMII_API_KEY;
  if (!apiKey) return null;
  const base = (process.env.TERMII_BASE_URL ?? "https://api.ng.termii.com").replace(/\/$/, "");
  return { apiKey, base };
}

async function post(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  const text = (await response.text()).slice(0, 300);
  return { ok: response.ok, status: response.status, text };
}

function failure(channel: Notification["channel"], to: Who, error: unknown): Notification {
  const detail = error instanceof Error ? error.message : "The request failed";
  console.error(`[messages] ${channel} to ${to} failed: ${detail}`);
  return { channel, to, status: "failed", detail };
}

async function sendSms(phone: string, text: string, to: Who): Promise<Notification> {
  const service = termii();
  if (!service) {
    console.log(`[messages:test mode] SMS to ${to} (${phone}): ${text}`);
    return { channel: "sms", to, status: "logged" };
  }
  try {
    const sender = process.env.TERMII_SENDER_ID;
    // With a registered sender ID the message shows that name. Without one, Termii's
    // "number" route is used, which needs no sender ID but looks less polished.
    const result = sender
      ? await post(`${service.base}/api/sms/send`, {
          api_key: service.apiKey,
          to: phone,
          from: sender,
          sms: text,
          type: "plain",
          channel: process.env.TERMII_SMS_CHANNEL ?? "generic",
        })
      : await post(`${service.base}/api/sms/number/send`, {
          api_key: service.apiKey,
          to: phone,
          sms: text,
        });
    if (!result.ok) {
      return failure("sms", to, new Error(`Termii answered ${result.status}: ${result.text}`));
    }
    return { channel: "sms", to, status: "sent" };
  } catch (error) {
    return failure("sms", to, error);
  }
}

async function sendWhatsApp(
  phone: string,
  templateId: string | undefined,
  data: Record<string, string>,
  to: Who
): Promise<Notification> {
  const service = termii();
  if (!service) {
    console.log(`[messages:test mode] WhatsApp to ${to} (${phone}): ${JSON.stringify(data)}`);
    return { channel: "whatsapp", to, status: "logged" };
  }
  const deviceId = process.env.TERMII_WHATSAPP_DEVICE_ID;
  if (!deviceId || !templateId) {
    return { channel: "whatsapp", to, status: "skipped", detail: "WhatsApp is not set up yet" };
  }
  try {
    // A business has to start a WhatsApp conversation with an approved template
    const result = await post(`${service.base}/api/send/template`, {
      api_key: service.apiKey,
      phone_number: phone,
      device_id: deviceId,
      template_id: templateId,
      data,
    });
    if (!result.ok) {
      return failure("whatsapp", to, new Error(`Termii answered ${result.status}: ${result.text}`));
    }
    return { channel: "whatsapp", to, status: "sent" };
  } catch (error) {
    return failure("whatsapp", to, error);
  }
}

// Messages the customer and the restaurant, on SMS and on WhatsApp.
// A message that fails never stops the order. The result says what happened to each one.
export async function notifyOrder(order: Order, customer: Customer): Promise<Notification[]> {
  const jobs: Promise<Notification>[] = [
    sendSms(customer.phone, customerSms(order, customer), "customer"),
    sendWhatsApp(
      customer.phone,
      process.env.TERMII_WA_TEMPLATE_CUSTOMER,
      customerWhatsAppData(order, customer),
      "customer"
    ),
  ];

  const restaurantPhone = normalizeNgPhone(process.env.RESTAURANT_PHONE ?? "");
  if (restaurantPhone) {
    jobs.push(
      sendSms(restaurantPhone, restaurantSms(order, customer), "restaurant"),
      sendWhatsApp(
        restaurantPhone,
        process.env.TERMII_WA_TEMPLATE_RESTAURANT,
        restaurantWhatsAppData(order, customer),
        "restaurant"
      )
    );
  } else {
    console.warn("[messages] RESTAURANT_PHONE is not set, so the restaurant was NOT alerted about this order.");
    jobs.push(
      Promise.resolve<Notification>({ channel: "sms", to: "restaurant", status: "skipped", detail: "RESTAURANT_PHONE is not set" }),
      Promise.resolve<Notification>({ channel: "whatsapp", to: "restaurant", status: "skipped", detail: "RESTAURANT_PHONE is not set" })
    );
  }

  return Promise.all(jobs);
}
