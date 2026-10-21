import { isAdmin } from "@/lib/adminAuth";
import { deleteMenuItem, upsertMenuItem } from "@/lib/db";
import { json, readJson } from "@/lib/http";
import { getDishes, getMenu } from "@/lib/menu";
import { applyMenuInput, newDishId } from "@/lib/menuInput";
import type { MenuItem } from "@/lib/menuTypes";

const blank: MenuItem = {
  id: "",
  name: "",
  description: "",
  price: 0,
  category: "",
  image: "",
  ingredients: [],
  tags: [],
  available: true,
  featured: false,
  sortOrder: 0,
};

export async function GET() {
  if (!(await isAdmin())) return json({ error: "Please log in." }, 401);
  return json({ items: await getMenu() });
}

// Adds a dish
export async function POST(request: Request) {
  if (!(await isAdmin())) return json({ error: "Please log in." }, 401);
  const body = await readJson(request);
  if (!body) return json({ error: "Invalid request." }, 400);

  if (typeof body.name !== "string" || typeof body.category !== "string" || typeof body.price !== "number") {
    return json({ error: "A dish needs a name, a category and a price." }, 400);
  }

  const menu = await getMenu();
  // New dishes go to the end of the menu
  const sortOrder = menu.reduce((highest, item) => Math.max(highest, item.sortOrder), -1) + 1;

  let id = newDishId(body.name);
  for (let tries = 0; tries < 5 && (await getDishes([id])).length > 0; tries++) {
    id = newDishId(body.name);
  }

  const result = applyMenuInput({ ...blank, id, sortOrder }, body);
  if (!result.ok) return json({ error: result.error }, 400);

  await upsertMenuItem(result.item);
  return json({ item: result.item }, 201);
}

// Changes a dish. Only the fields sent are changed.
export async function PATCH(request: Request) {
  if (!(await isAdmin())) return json({ error: "Please log in." }, 401);
  const body = await readJson(request);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!body || !id) return json({ error: "Invalid request." }, 400);

  const [existing] = await getDishes([id]);
  if (!existing) return json({ error: "That dish no longer exists." }, 404);

  const { id: _ignored, ...changes } = body;
  void _ignored;
  const result = applyMenuInput(existing, changes);
  if (!result.ok) return json({ error: result.error }, 400);

  await upsertMenuItem(result.item);
  return json({ item: result.item });
}

// Removes a dish. Orders already placed keep their own copy of what was ordered.
export async function DELETE(request: Request) {
  if (!(await isAdmin())) return json({ error: "Please log in." }, 401);
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) return json({ error: "Invalid request." }, 400);
  await deleteMenuItem(id);
  return json({ ok: true });
}
