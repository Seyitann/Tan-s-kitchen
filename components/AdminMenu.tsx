"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Pencil, Plus, Star, Trash2, Upload } from "lucide-react";
import { naira } from "@/lib/format";
import { allTags } from "@/lib/menuTypes";
import type { MenuItem, Tag } from "@/lib/menuTypes";
import AdminNav from "./AdminNav";
import { charcoal, curved, curvedSm, dark, solid } from "./buttonStyles";

const field =
  "w-full rounded-[0.5rem] border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-orange-500 focus:outline-none";

// Phone photos are often 5 MB or more. This shrinks the photo in the browser first,
// so it uploads quickly on mobile data and stays under the host's size limit.
async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No canvas");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No image"))),
      "image/jpeg",
      0.85
    )
  );
}

function MenuForm({
  initial,
  categories,
  onSaved,
  onCancel,
}: {
  initial: MenuItem | null;
  categories: string[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [category, setCategory] = useState(initial?.category ?? categories[0] ?? "");
  const [ingredients, setIngredients] = useState(initial?.ingredients.join(", ") ?? "");
  const [tags, setTags] = useState<Tag[]>(initial?.tags ?? []);
  const [image, setImage] = useState(initial?.image ?? "");
  const [available, setAvailable] = useState(initial?.available ?? true);
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const small = await shrinkImage(file);
      const form = new FormData();
      form.append("file", small, "dish.jpg");
      const response = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.url) {
        setError(data?.error ?? "The photo could not be uploaded. Please try again.");
        return;
      }
      setImage(data.url);
    } catch {
      setError("We could not read that photo. Try a JPG, PNG or WebP picture.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = {
        ...(initial ? { id: initial.id } : {}),
        name,
        description,
        price: Number(price),
        category,
        ingredients: ingredients.split(",").map((part) => part.trim()).filter(Boolean),
        tags,
        image,
        available,
        featured,
      };
      const response = await fetch("/api/admin/menu", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "That did not save. Please try again.");
        return;
      }
      onSaved();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function toggleTag(tag: Tag) {
    setTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[0.8rem] rounded-tr-[2rem] border border-orange-500/40 bg-stone-900/80 p-6"
    >
      <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold">
        {initial ? `Edit ${initial.name}` : "Add a dish"}
      </h2>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="dish-name" className="text-xs font-extrabold uppercase tracking-wide text-stone-400">
            Name
          </label>
          <input id="dish-name" className={`${field} mt-2`} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        </div>

        <div>
          <label htmlFor="dish-price" className="text-xs font-extrabold uppercase tracking-wide text-stone-400">
            Price (naira)
          </label>
          <input
            id="dish-price"
            className={`${field} mt-2`}
            type="number"
            inputMode="numeric"
            min={0}
            step={50}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="dish-category" className="text-xs font-extrabold uppercase tracking-wide text-stone-400">
            Category
          </label>
          <input
            id="dish-category"
            className={`${field} mt-2`}
            list="dish-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Rice, Soups, Drinks..."
            required
            maxLength={40}
          />
          <datalist id="dish-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="dish-description" className="text-xs font-extrabold uppercase tracking-wide text-stone-400">
            Description
          </label>
          <textarea id="dish-description" className={`${field} mt-2`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="dish-ingredients" className="text-xs font-extrabold uppercase tracking-wide text-stone-400">
            Ingredients (separate with commas)
          </label>
          <input id="dish-ingredients" className={`${field} mt-2`} value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="rice, tomato, pepper, onion" />
        </div>

        <div className="md:col-span-2">
          <p className="text-xs font-extrabold uppercase tracking-wide text-stone-400">Tags</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`${curvedSm} px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide ${
                  tags.includes(tag) ? solid : charcoal
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <p className="text-xs font-extrabold uppercase tracking-wide text-stone-400">Photo</p>
          <div className="mt-2 flex items-center gap-4">
            <span
              className="h-20 w-28 shrink-0 rounded-[0.5rem] bg-stone-800 bg-cover bg-center"
              style={image ? { backgroundImage: `url(${image})` } : undefined}
              aria-hidden="true"
            />
            <div>
              <label
                className={`${curved} ${dark} inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide`}
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : image ? "Change photo" : "Upload photo"}
                <input type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={uploading} />
              </label>
              {image && (
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="ml-3 text-xs text-stone-400 underline hover:text-white"
                >
                  Remove
                </button>
              )}
              <p className="mt-2 text-xs text-stone-500">
                Any phone photo works. It is shrunk automatically.
              </p>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="h-4 w-4 accent-orange-500" />
          Available to order
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-orange-500" />
          Show on the home page (top picks)
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-orange-400">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy || uploading}
          className={`${curved} ${solid} px-8 py-2.5 text-xs font-extrabold uppercase tracking-wide disabled:opacity-60`}
        >
          {busy ? "Saving..." : "Save dish"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`${curved} ${charcoal} px-8 py-2.5 text-xs font-extrabold uppercase tracking-wide`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AdminMenu() {
  const [auth, setAuth] = useState<"checking" | "out" | "in">("checking");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/menu", { cache: "no-store" });
      if (response.status === 401) {
        setAuth("out");
        return;
      }
      if (!response.ok) throw new Error("Bad response");
      const data = (await response.json()) as { items: MenuItem[] };
      setItems(data.items);
      setAuth("in");
      setError("");
    } catch {
      setError("Could not load the menu. Check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);

  // One request that changes a dish, then refresh the list
  async function change(id: string, fields: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch("/api/admin/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields }),
      });
      if (response.status === 401) {
        setAuth("out");
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "That did not save. Please try again.");
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      await load();
      setBusyId(null);
    }
  }

  // Swaps a dish with its neighbour in the same category
  async function move(item: MenuItem, direction: -1 | 1) {
    const group = items.filter((i) => i.category === item.category);
    const index = group.findIndex((i) => i.id === item.id);
    const other = group[index + direction];
    if (!other) return;
    setBusyId(item.id);
    try {
      for (const [id, sortOrder] of [
        [item.id, other.sortOrder],
        [other.id, item.sortOrder],
      ] as const) {
        await fetch("/api/admin/menu", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, sortOrder }),
        });
      }
    } finally {
      await load();
      setBusyId(null);
    }
  }

  async function remove(item: MenuItem) {
    if (!window.confirm(`Delete ${item.name} from the menu? Past orders keep their record of it.`)) return;
    setBusyId(item.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/menu?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      if (!response.ok) setError("That did not delete. Please try again.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      await load();
      setBusyId(null);
    }
  }

  if (auth === "checking") {
    return <p className="py-20 text-center text-stone-400">Loading...</p>;
  }

  if (auth === "out") {
    return (
      <div className="py-20 text-center">
        <p className="text-stone-300">Please log in on the Orders page first.</p>
        <Link
          href="/admin"
          className={`${curved} ${solid} mt-6 inline-block px-8 py-2.5 text-xs font-extrabold uppercase tracking-wide`}
        >
          Go to the owner login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <AdminNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold">Menu</h1>
        {editing === null && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className={`${curved} ${solid} inline-flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold uppercase tracking-wide`}
          >
            <Plus className="h-4 w-4" />
            Add a dish
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-stone-500">
        Changes show on the website straight away. Sold-out dishes stay on the menu but cannot be ordered. The star puts a dish on the home page.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-orange-400">
          {error}
        </p>
      )}

      {editing !== null && (
        <div className="mt-6">
          <MenuForm
            key={editing === "new" ? "new" : editing.id}
            initial={editing === "new" ? null : editing}
            categories={categories}
            onSaved={async () => {
              setEditing(null);
              await load();
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {items.length === 0 ? (
        <p className="py-16 text-center text-stone-400">The menu is empty. Add your first dish.</p>
      ) : (
        categories.map((category) => (
          <section key={category} className="mt-8">
            <h2 className="mb-3 text-sm font-extrabold uppercase tracking-widest text-orange-300">
              {category}
            </h2>
            <ul className="space-y-3">
              {items
                .filter((item) => item.category === category)
                .map((item, index, group) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center gap-4 rounded-[0.8rem] rounded-tr-[1.6rem] border border-white/10 bg-stone-900/60 p-4"
                  >
                    <span
                      className="h-16 w-20 shrink-0 rounded-[0.5rem] bg-stone-800 bg-cover bg-center"
                      style={item.image ? { backgroundImage: `url(${item.image})` } : undefined}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{item.name}</p>
                      <p className="text-sm text-orange-400">{naira.format(item.price)}</p>
                      {item.tags.length > 0 && (
                        <p className="mt-1 text-xs text-stone-500">{item.tags.join(" / ")}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => change(item.id, { available: !item.available })}
                        className={`${curvedSm} px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide disabled:opacity-60 ${
                          item.available ? dark : charcoal
                        }`}
                      >
                        {item.available ? "Available" : "Sold out"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => change(item.id, { featured: !item.featured })}
                        aria-label={item.featured ? "Remove from the home page" : "Show on the home page"}
                        title={item.featured ? "On the home page. Click to remove." : "Click to show on the home page"}
                        className={`${curvedSm} ${dark} grid h-9 w-9 place-items-center disabled:opacity-60`}
                      >
                        <Star className={`h-4 w-4 ${item.featured ? "fill-orange-400 text-orange-400" : ""}`} />
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.id || index === 0}
                        onClick={() => move(item, -1)}
                        aria-label="Move up"
                        className={`${curvedSm} ${dark} grid h-9 w-9 place-items-center disabled:opacity-30`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.id || index === group.length - 1}
                        onClick={() => move(item, 1)}
                        aria-label="Move down"
                        className={`${curvedSm} ${dark} grid h-9 w-9 place-items-center disabled:opacity-30`}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(item)}
                        aria-label={`Edit ${item.name}`}
                        className={`${curvedSm} ${dark} grid h-9 w-9 place-items-center`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => remove(item)}
                        aria-label={`Delete ${item.name}`}
                        className={`${curvedSm} ${dark} grid h-9 w-9 place-items-center disabled:opacity-60`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
