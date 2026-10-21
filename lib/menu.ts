import { menu as starter } from "@/data/menu";
import { getMenuItemsByIds, listMenuItems, seedMenuIfNeeded } from "./db";
import { allTags } from "./menuTypes";
import type { MenuItem, Tag } from "./menuTypes";

// The dishes in data/menu.ts become the first menu in the database, once.
// After that the database is the menu, and the owner edits it at /admin/menu.
function starterItems(): MenuItem[] {
  return starter.map((item, index) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    price: item.price,
    category: String(item.category),
    image: item.image ?? "",
    ingredients: [...(item.ingredients ?? [])],
    tags: (item.tags ?? [])
      .map((tag) => String(tag))
      .filter((tag): tag is Tag => (allTags as readonly string[]).includes(tag)),
    available: true,
    featured: index < 4,
    sortOrder: index,
  }));
}

let seeded = false;

async function ensureSeeded() {
  if (seeded) return;
  await seedMenuIfNeeded(starterItems());
  seeded = true;
}

export async function getMenu(): Promise<MenuItem[]> {
  await ensureSeeded();
  return listMenuItems();
}

export async function getDishes(ids: string[]): Promise<MenuItem[]> {
  await ensureSeeded();
  return getMenuItemsByIds(ids);
}
