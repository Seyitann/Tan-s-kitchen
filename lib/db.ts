// Storage for customers and orders.
//
// Two places the data can live:
//   - Supabase (a real database), used whenever SUPABASE_URL and a secret key are set.
//     This is what the live website uses.
//   - A file on your computer (.data/db.json), used while you build and test locally.
//     Hosts like Vercel do not keep files, so the live site must use Supabase.
// The rest of the app only uses the functions exported at the bottom of this file.
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderStatus } from "./orderStatus";
import type { MenuItem } from "./menuTypes";

export type Customer = {
  id: string;
  name: string;
  phone: string; // 2348031234567
  passwordHash: string;
  createdAt: string;
};

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type Notification = {
  channel: "sms" | "whatsapp";
  to: "restaurant" | "customer";
  status: "sent" | "failed" | "skipped" | "logged";
  detail?: string;
};

export type Order = {
  id: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfilment: "delivery" | "pickup";
  address: string;
  notes: string;
  // Online orders start as "awaiting_payment" and pay-on-delivery orders as "received".
  // The owner moves them along from there. The steps are in lib/orderStatus.ts.
  status: OrderStatus;
  paymentMethod: "online" | "on_delivery";
  paymentStatus: "unpaid" | "paid" | "failed";
  paymentReference: string | null;
  paidAt: string | null;
  createdAt: string;
  notifications: Notification[];
};

type Data = {
  customers: Customer[];
  orders: Order[];
  menu: MenuItem[];
  // Once true, the menu in the database is the real one and the starter menu is never copied again
  menuSeeded: boolean;
};

// Both stores offer exactly these functions
type Store = {
  findCustomerByPhone(phone: string): Promise<Customer | null>;
  findCustomerById(id: string): Promise<Customer | null>;
  // Returns null if that phone number already has an account
  createCustomer(input: {
    name: string;
    phone: string;
    passwordHash: string;
  }): Promise<Customer | null>;
  createOrder(order: Order): Promise<void>;
  saveNotifications(orderId: string, notifications: Notification[]): Promise<void>;
  getOrder(id: string): Promise<Order | null>;
  listOrdersForCustomer(customerId: string): Promise<Order[]>;
  countOrdersSince(customerId: string, sinceIso: string): Promise<number>;
  // Remembers the latest payment attempt for an order
  setPaymentReference(orderId: string, reference: string): Promise<void>;
  // Marks an order paid. Returns true only for the call that actually changed it,
  // so the "new paid order" messages go out exactly once.
  markPaid(orderId: string, reference: string, paidAtIso: string): Promise<boolean>;
  markPaymentFailed(orderId: string): Promise<void>;
  // For the owner page
  listRecentOrders(limit: number): Promise<Order[]>;
  findCustomersByIds(ids: string[]): Promise<Customer[]>;
  // Moves an order to a new status, but only if it is still in the status the owner was
  // looking at. Returns false if someone else changed it first.
  updateOrderStatus(orderId: string, from: OrderStatus, to: OrderStatus): Promise<boolean>;
  // The menu
  listMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByIds(ids: string[]): Promise<MenuItem[]>;
  upsertMenuItem(item: MenuItem): Promise<void>;
  deleteMenuItem(id: string): Promise<void>;
  // Copies the starter menu into storage the first time only
  seedMenuIfNeeded(items: MenuItem[]): Promise<void>;
  // Stores a (already shrunk) photo and returns the address it can be shown from
  saveMenuImage(bytes: Buffer): Promise<string>;
};

const byMenuOrder = (a: MenuItem, b: MenuItem) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

// ---------- Local file ----------

const FILE = path.join(process.cwd(), ".data", "db.json");

// Changes happen one after another, so two requests cannot overwrite each other
let queue: Promise<unknown> = Promise.resolve();

// Orders saved before online payment existed get sensible defaults
function withPaymentDefaults(order: Order): Order {
  return {
    ...order,
    paymentMethod: order.paymentMethod ?? "on_delivery",
    paymentStatus: order.paymentStatus ?? "unpaid",
    paymentReference: order.paymentReference ?? null,
    paidAt: order.paidAt ?? null,
  };
}

async function read(): Promise<Data> {
  try {
    const data = JSON.parse(await fs.readFile(FILE, "utf8")) as Partial<Data>;
    return {
      customers: data.customers ?? [],
      orders: (data.orders ?? []).map(withPaymentDefaults),
      menu: data.menu ?? [],
      menuSeeded: data.menuSeeded ?? false,
    };
  } catch {
    return { customers: [], orders: [], menu: [], menuSeeded: false };
  }
}

async function write(data: Data) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const temp = FILE + ".tmp";
  await fs.writeFile(temp, JSON.stringify(data, null, 2));
  await fs.rename(temp, FILE);
}

function update<T>(change: (data: Data) => T): Promise<T> {
  const run = queue.then(async () => {
    const data = await read();
    const result = change(data);
    await write(data);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

const fileStore: Store = {
  async findCustomerByPhone(phone) {
    const data = await read();
    return data.customers.find((c) => c.phone === phone) ?? null;
  },

  async findCustomerById(id) {
    const data = await read();
    return data.customers.find((c) => c.id === id) ?? null;
  },

  createCustomer(input) {
    return update((data) => {
      if (data.customers.some((c) => c.phone === input.phone)) return null;
      const customer: Customer = {
        id: randomUUID(),
        ...input,
        createdAt: new Date().toISOString(),
      };
      data.customers.push(customer);
      return customer;
    });
  },

  createOrder(order) {
    return update((data) => {
      data.orders.push(order);
    });
  },

  saveNotifications(orderId, notifications) {
    return update((data) => {
      const order = data.orders.find((o) => o.id === orderId);
      if (order) order.notifications = notifications;
    });
  },

  async getOrder(id) {
    const data = await read();
    return data.orders.find((o) => o.id === id) ?? null;
  },

  async listOrdersForCustomer(customerId) {
    const data = await read();
    return data.orders
      .filter((o) => o.customerId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async countOrdersSince(customerId, sinceIso) {
    const data = await read();
    return data.orders.filter(
      (o) => o.customerId === customerId && o.createdAt >= sinceIso
    ).length;
  },

  setPaymentReference(orderId, reference) {
    return update((data) => {
      const order = data.orders.find((o) => o.id === orderId);
      if (order && order.paymentStatus !== "paid") order.paymentReference = reference;
    });
  },

  markPaid(orderId, reference, paidAtIso) {
    return update((data) => {
      const order = data.orders.find((o) => o.id === orderId);
      if (!order || order.paymentStatus === "paid") return false;
      order.paymentStatus = "paid";
      order.paymentReference = reference;
      order.paidAt = paidAtIso;
      order.status = "received";
      return true;
    });
  },

  markPaymentFailed(orderId) {
    return update((data) => {
      const order = data.orders.find((o) => o.id === orderId);
      if (order && order.paymentStatus === "unpaid") order.paymentStatus = "failed";
    });
  },

  async listRecentOrders(limit) {
    const data = await read();
    return [...data.orders]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  },

  async findCustomersByIds(ids) {
    const data = await read();
    return data.customers.filter((c) => ids.includes(c.id));
  },

  updateOrderStatus(orderId, from, to) {
    return update((data) => {
      const order = data.orders.find((o) => o.id === orderId);
      if (!order || order.status !== from) return false;
      order.status = to;
      return true;
    });
  },

  async listMenuItems() {
    const data = await read();
    return [...data.menu].sort(byMenuOrder);
  },

  async getMenuItemsByIds(ids) {
    const data = await read();
    return data.menu.filter((item) => ids.includes(item.id));
  },

  upsertMenuItem(item) {
    return update((data) => {
      const index = data.menu.findIndex((m) => m.id === item.id);
      if (index === -1) data.menu.push(item);
      else data.menu[index] = item;
    });
  },

  deleteMenuItem(id) {
    return update((data) => {
      data.menu = data.menu.filter((m) => m.id !== id);
    });
  },

  seedMenuIfNeeded(items) {
    return update((data) => {
      if (data.menuSeeded) return;
      for (const item of items) {
        if (!data.menu.some((m) => m.id === item.id)) data.menu.push(item);
      }
      data.menuSeeded = true;
    });
  },

  // While testing on your computer, photos go into public/uploads.
  // The live site stores them in Supabase instead.
  async saveMenuImage(bytes) {
    const name = `${randomUUID()}.webp`;
    const folder = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, name), bytes);
    return `/uploads/${name}`;
  },
};

// ---------- Supabase ----------

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  password_hash: string;
  created_at: string;
};

type OrderRow = {
  id: string;
  customer_id: string;
  items: Order["items"];
  subtotal: number;
  delivery_fee: number;
  total: number;
  fulfilment: Order["fulfilment"];
  address: string;
  notes: string;
  status: Order["status"];
  notifications: Notification[] | null;
  payment_method: Order["paymentMethod"];
  payment_status: Order["paymentStatus"];
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
};

const toCustomer = (row: CustomerRow): Customer => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  passwordHash: row.password_hash,
  createdAt: row.created_at,
});

const toOrder = (row: OrderRow): Order => ({
  id: row.id,
  customerId: row.customer_id,
  items: row.items,
  subtotal: row.subtotal,
  deliveryFee: row.delivery_fee,
  total: row.total,
  fulfilment: row.fulfilment,
  address: row.address,
  notes: row.notes,
  status: row.status,
  createdAt: row.created_at,
  notifications: row.notifications ?? [],
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  paymentReference: row.payment_reference,
  paidAt: row.paid_at,
});

type MenuRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  ingredients: string[] | null;
  tags: MenuItem["tags"] | null;
  available: boolean;
  featured: boolean;
  sort_order: number;
};

const toMenuItem = (row: MenuRow): MenuItem => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: row.price,
  category: row.category,
  image: row.image,
  ingredients: row.ingredients ?? [],
  tags: row.tags ?? [],
  available: row.available,
  featured: row.featured,
  sortOrder: row.sort_order,
});

const fromMenuItem = (item: MenuItem) => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price: item.price,
  category: item.category,
  image: item.image,
  ingredients: item.ingredients,
  tags: item.tags,
  available: item.available,
  featured: item.featured,
  sort_order: item.sortOrder,
  updated_at: new Date().toISOString(),
});

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  // Supabase calls this the "secret key" (older projects: the "service_role key").
  // It can read and write everything, so it must only ever be used here on the server.
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

let client: SupabaseClient | null = null;

function supabase() {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase is not configured");
  client ??= createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

function check(error: { message: string } | null) {
  if (error) throw new Error(`Database error: ${error.message}`);
}

const supabaseStore: Store = {
  async findCustomerByPhone(phone) {
    const { data, error } = await supabase()
      .from("customers")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();
    check(error);
    return data ? toCustomer(data as CustomerRow) : null;
  },

  async findCustomerById(id) {
    const { data, error } = await supabase()
      .from("customers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    check(error);
    return data ? toCustomer(data as CustomerRow) : null;
  },

  async createCustomer(input) {
    const { data, error } = await supabase()
      .from("customers")
      .insert({
        name: input.name,
        phone: input.phone,
        password_hash: input.passwordHash,
      })
      .select("*")
      .single();
    // 23505 means the phone number is already taken
    if (error?.code === "23505") return null;
    check(error);
    return toCustomer(data as CustomerRow);
  },

  async createOrder(order) {
    const { error } = await supabase().from("orders").insert({
      id: order.id,
      customer_id: order.customerId,
      items: order.items,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      total: order.total,
      fulfilment: order.fulfilment,
      address: order.address,
      notes: order.notes,
      status: order.status,
      notifications: order.notifications,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      payment_reference: order.paymentReference,
      paid_at: order.paidAt,
      created_at: order.createdAt,
    });
    check(error);
  },

  async saveNotifications(orderId, notifications) {
    const { error } = await supabase()
      .from("orders")
      .update({ notifications })
      .eq("id", orderId);
    check(error);
  },

  async getOrder(id) {
    const { data, error } = await supabase()
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    check(error);
    return data ? toOrder(data as OrderRow) : null;
  },

  async listOrdersForCustomer(customerId) {
    const { data, error } = await supabase()
      .from("orders")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    check(error);
    return ((data ?? []) as OrderRow[]).map(toOrder);
  },

  async setPaymentReference(orderId, reference) {
    const { error } = await supabase()
      .from("orders")
      .update({ payment_reference: reference })
      .eq("id", orderId)
      .neq("payment_status", "paid");
    check(error);
  },

  async markPaid(orderId, reference, paidAtIso) {
    // The "not already paid" condition makes this safe when two requests arrive together:
    // only one of them changes the row, and only that one gets true back.
    const { data, error } = await supabase()
      .from("orders")
      .update({
        payment_status: "paid",
        payment_reference: reference,
        paid_at: paidAtIso,
        status: "received",
      })
      .eq("id", orderId)
      .neq("payment_status", "paid")
      .select("id");
    check(error);
    return (data ?? []).length > 0;
  },

  async markPaymentFailed(orderId) {
    const { error } = await supabase()
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", orderId)
      .eq("payment_status", "unpaid");
    check(error);
  },

  async listRecentOrders(limit) {
    const { data, error } = await supabase()
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    check(error);
    return ((data ?? []) as OrderRow[]).map(toOrder);
  },

  async findCustomersByIds(ids) {
    if (ids.length === 0) return [];
    const { data, error } = await supabase()
      .from("customers")
      .select("*")
      .in("id", ids);
    check(error);
    return ((data ?? []) as CustomerRow[]).map(toCustomer);
  },

  async updateOrderStatus(orderId, from, to) {
    // The status condition means two people pressing buttons at once cannot both succeed
    const { data, error } = await supabase()
      .from("orders")
      .update({ status: to })
      .eq("id", orderId)
      .eq("status", from)
      .select("id");
    check(error);
    return (data ?? []).length > 0;
  },

  async listMenuItems() {
    const { data, error } = await supabase()
      .from("menu_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    check(error);
    return ((data ?? []) as MenuRow[]).map(toMenuItem);
  },

  async getMenuItemsByIds(ids) {
    if (ids.length === 0) return [];
    const { data, error } = await supabase().from("menu_items").select("*").in("id", ids);
    check(error);
    return ((data ?? []) as MenuRow[]).map(toMenuItem);
  },

  async upsertMenuItem(item) {
    const { error } = await supabase()
      .from("menu_items")
      .upsert(fromMenuItem(item), { onConflict: "id" });
    check(error);
  },

  async deleteMenuItem(id) {
    const { error } = await supabase().from("menu_items").delete().eq("id", id);
    check(error);
  },

  async seedMenuIfNeeded(items) {
    const { data: flag, error } = await supabase()
      .from("settings")
      .select("key")
      .eq("key", "menu_seeded")
      .maybeSingle();
    check(error);
    if (flag) return;
    // "Ignore duplicates" makes this safe if two visitors trigger it at the same moment
    const { error: insertError } = await supabase()
      .from("menu_items")
      .upsert(items.map(fromMenuItem), { onConflict: "id", ignoreDuplicates: true });
    check(insertError);
    const { error: flagError } = await supabase()
      .from("settings")
      .upsert({ key: "menu_seeded", value: true }, { onConflict: "key" });
    check(flagError);
  },

  async saveMenuImage(bytes) {
    const name = `${randomUUID()}.webp`;
    const bucket = supabase().storage.from("menu-images");
    const { error } = await bucket.upload(name, bytes, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(`Storage error: ${error.message}`);
    return bucket.getPublicUrl(name).data.publicUrl;
  },

  async countOrdersSince(customerId, sinceIso) {
    const { count, error } = await supabase()
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .gte("created_at", sinceIso);
    check(error);
    return count ?? 0;
  },
};

// ---------- Which one to use ----------

function store(): Store {
  if (supabaseConfig()) return supabaseStore;
  if (process.env.VERCEL) {
    throw new Error(
      "The website is running on Vercel without a database. Set SUPABASE_URL and SUPABASE_SECRET_KEY in the Vercel project settings."
    );
  }
  return fileStore;
}

export const findCustomerByPhone: Store["findCustomerByPhone"] = (phone) =>
  store().findCustomerByPhone(phone);
export const findCustomerById: Store["findCustomerById"] = (id) =>
  store().findCustomerById(id);
export const createCustomer: Store["createCustomer"] = (input) =>
  store().createCustomer(input);
export const createOrder: Store["createOrder"] = (order) =>
  store().createOrder(order);
export const saveNotifications: Store["saveNotifications"] = (orderId, notifications) =>
  store().saveNotifications(orderId, notifications);
export const getOrder: Store["getOrder"] = (id) => store().getOrder(id);
export const listOrdersForCustomer: Store["listOrdersForCustomer"] = (customerId) =>
  store().listOrdersForCustomer(customerId);
export const countOrdersSince: Store["countOrdersSince"] = (customerId, sinceIso) =>
  store().countOrdersSince(customerId, sinceIso);
export const setPaymentReference: Store["setPaymentReference"] = (orderId, reference) =>
  store().setPaymentReference(orderId, reference);
export const markPaid: Store["markPaid"] = (orderId, reference, paidAtIso) =>
  store().markPaid(orderId, reference, paidAtIso);
export const markPaymentFailed: Store["markPaymentFailed"] = (orderId) =>
  store().markPaymentFailed(orderId);
export const listRecentOrders: Store["listRecentOrders"] = (limit) =>
  store().listRecentOrders(limit);
export const findCustomersByIds: Store["findCustomersByIds"] = (ids) =>
  store().findCustomersByIds(ids);
export const updateOrderStatus: Store["updateOrderStatus"] = (orderId, from, to) =>
  store().updateOrderStatus(orderId, from, to);
export const listMenuItems: Store["listMenuItems"] = () => store().listMenuItems();
export const getMenuItemsByIds: Store["getMenuItemsByIds"] = (ids) =>
  store().getMenuItemsByIds(ids);
export const upsertMenuItem: Store["upsertMenuItem"] = (item) => store().upsertMenuItem(item);
export const deleteMenuItem: Store["deleteMenuItem"] = (id) => store().deleteMenuItem(id);
export const seedMenuIfNeeded: Store["seedMenuIfNeeded"] = (items) =>
  store().seedMenuIfNeeded(items);
export const saveMenuImage: Store["saveMenuImage"] = (bytes) => store().saveMenuImage(bytes);
