import type { Customer, Order } from "./db";

// SMS only fits 160 characters per message when it uses plain characters.
// One fancy character (like the naira sign) cuts that to 70, so SMS text is kept plain.
const plain = (text: string) =>
  text.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();

// WhatsApp template values cannot contain line breaks
const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();

const smsMoney = (amount: number) => "N" + amount.toLocaleString("en-NG");
const waMoney = (amount: number) => "₦" + amount.toLocaleString("en-NG");

const firstName = (customer: Customer) => customer.name.split(" ")[0];

function itemsLine(order: Order) {
  return order.items.map((i) => `${i.quantity} x ${i.name}`).join(", ");
}

function where(order: Order) {
  return order.fulfilment === "delivery"
    ? `Deliver to: ${order.address}`
    : "Pickup";
}

export function restaurantSms(order: Order, customer: Customer) {
  const note = order.notes ? ` Note: ${order.notes}` : "";
  return plain(
    `New order ${order.id} from ${customer.name} (${customer.phone}). ${itemsLine(order)}. Total ${smsMoney(order.total)}. ${where(order)}.${note}`
  ).slice(0, 320);
}

export function customerSms(order: Order, customer: Customer) {
  const next =
    order.fulfilment === "delivery"
      ? "We will deliver it to you."
      : "It will be ready for pickup.";
  return plain(
    `Hi ${firstName(customer)}, Tan's Kitchen received your order ${order.id}. Total ${smsMoney(order.total)}. ${next} Thank you!`
  );
}

// WhatsApp templates take numbered values: "1" is the first blank, "2" the second, and so on.
// The numbers here must match the blanks in the templates approved for your WhatsApp account.
export function restaurantWhatsAppData(order: Order, customer: Customer) {
  return {
    "1": order.id,
    "2": oneLine(customer.name),
    "3": customer.phone,
    "4": oneLine(itemsLine(order)),
    "5": waMoney(order.total),
    "6": oneLine(where(order) + (order.notes ? `. Note: ${order.notes}` : "")),
  };
}

export function customerWhatsAppData(order: Order, customer: Customer) {
  return {
    "1": firstName(customer),
    "2": order.id,
    "3": waMoney(order.total),
  };
}
