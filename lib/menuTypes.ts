// What a dish looks like everywhere in the app. The menu itself lives in the database
// and is edited by the owner at /admin/menu.

export const allTags = ["popular", "new", "spicy", "vegetarian", "vegan", "fish"] as const;
export type Tag = (typeof allTags)[number];

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number; // in naira
  category: string;
  image: string; // empty when the dish has no photo yet
  ingredients: string[];
  tags: Tag[];
  available: boolean; // false shows "Sold out" and blocks ordering
  featured: boolean; // shown in "Try our top picks" on the home page
  sortOrder: number; // lower numbers come first
};
