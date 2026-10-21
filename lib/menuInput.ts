import { randomInt } from "crypto";
import { allTags } from "./menuTypes";
import type { MenuItem, Tag } from "./menuTypes";

// A photo can only be one this site made: a file in /images or /uploads, or one in
// this project's own Supabase storage. Links to other websites are refused.
function imageAllowed(url: string) {
  if (url === "") return true;
  if (url.startsWith("/images/") || url.startsWith("/uploads/")) return !url.includes("..");
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  return Boolean(base && url.startsWith(`${base}/storage/v1/object/public/menu-images/`));
}

const clean = (value: string) => value.trim().replace(/\s+/g, " ");

export function newDishId(name: string) {
  const slug = clean(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${slug || "dish"}-${randomInt(1000, 10000)}`;
}

// Checks what the owner sent and applies it on top of the dish as it is now.
// Fields that are not mentioned stay as they were, so a quick "sold out" switch
// only needs to send { available: false }.
export function applyMenuInput(
  base: MenuItem,
  body: Record<string, unknown>
): { ok: true; item: MenuItem } | { ok: false; error: string } {
  const item: MenuItem = { ...base, ingredients: [...base.ingredients], tags: [...base.tags] };

  if ("name" in body) {
    const name = clean(String(body.name ?? ""));
    if (name.length < 1 || name.length > 80) return { ok: false, error: "The dish needs a name of up to 80 characters." };
    item.name = name;
  }
  if ("description" in body) {
    const description = clean(String(body.description ?? ""));
    if (description.length > 300) return { ok: false, error: "Keep the description under 300 characters." };
    item.description = description;
  }
  if ("price" in body) {
    const price = body.price;
    if (typeof price !== "number" || !Number.isInteger(price) || price < 0 || price > 1_000_000) {
      return { ok: false, error: "The price must be a whole number of naira, like 4500." };
    }
    item.price = price;
  }
  if ("category" in body) {
    const category = clean(String(body.category ?? ""));
    if (category.length < 1 || category.length > 40) return { ok: false, error: "Choose a category of up to 40 characters." };
    item.category = category;
  }
  if ("image" in body) {
    const image = String(body.image ?? "");
    if (!imageAllowed(image)) return { ok: false, error: "That photo is not allowed. Upload it from the menu editor." };
    item.image = image;
  }
  if ("ingredients" in body) {
    if (!Array.isArray(body.ingredients)) return { ok: false, error: "Ingredients must be a list." };
    const list = body.ingredients.map((x) => clean(String(x))).filter(Boolean);
    if (list.length > 12 || list.some((x) => x.length > 30)) {
      return { ok: false, error: "Use at most 12 ingredients, each under 30 characters." };
    }
    item.ingredients = list;
  }
  if ("tags" in body) {
    if (!Array.isArray(body.tags) || body.tags.some((t) => !(allTags as readonly string[]).includes(String(t)))) {
      return { ok: false, error: "One of the tags is not recognised." };
    }
    item.tags = [...new Set(body.tags.map(String))] as Tag[];
  }
  if ("available" in body) {
    if (typeof body.available !== "boolean") return { ok: false, error: "Invalid request." };
    item.available = body.available;
  }
  if ("featured" in body) {
    if (typeof body.featured !== "boolean") return { ok: false, error: "Invalid request." };
    item.featured = body.featured;
  }
  if ("sortOrder" in body) {
    const order = body.sortOrder;
    if (typeof order !== "number" || !Number.isInteger(order) || order < 0 || order > 100000) {
      return { ok: false, error: "Invalid request." };
    }
    item.sortOrder = order;
  }
  return { ok: true, item };
}
