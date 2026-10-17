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
  status: "received";
  createdAt: string;
  notifications: Notification[];
};

type Data = { customers: Customer[]; orders: Order[] };

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
};

// ---------- Local file ----------

const FILE = path.join(process.cwd(), ".data", "db.json");

// Changes happen one after another, so two requests cannot overwrite each other
let queue: Promise<unknown> = Promise.resolve();

async function read(): Promise<Data> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Data;
  } catch {
    return { customers: [], orders: [] };
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