# Tan's Kitchen

The ordering website for Tan's Kitchen. Customers can look through the menu and order food online. It is built for a single restaurant, not as a marketplace with many vendors, so it works like the restaurant's own website with ordering built in.

The project is still in progress. The home page and menu page work with sample data. The cart, checkout, orders and owner admin area have not been built yet.

## What it is for

A customer opens the site, browses the menu by category, adds dishes to a cart, checks out as a guest and follows the order until it is delivered or ready for pickup. The owner logs in to a private admin area to change menu items and prices and to see incoming orders.

## Current status

Working now:

- Home page with a hero image and a link to the menu
- Menu page grouped by category, reading from a sample data file

Planned, in this order:

- Cart
- Real menu data stored in Supabase
- Orders and an order status page
- Owner admin area
- Online payment with Paystack
- Small animations with Motion

## Tools used

- Next.js with TypeScript, for the pages and the code behind them
- Tailwind CSS, for styling
- Zustand, for holding the cart (planned)
- Supabase, for the database and the owner's login (planned)
- Paystack, for payments (planned)
- Motion, for animations (planned)
- Vercel, for hosting (planned)

## Getting started

You need Node.js 20 or newer and Git installed.

```bash
git clone https://github.com/yourusername/tans-kitchen.git
cd tans-kitchen
npm install
npm run dev
```

Then open http://localhost:3000 for the home page and http://localhost:3000/menu for the menu.

## Adding photos

Put your photos in `public/images/`. The sample menu expects these file names:

- `hero.jpg` for the home page banner
- `jollof.jpg`, `fried-rice.jpg`, `egusi.jpg` and `suya.jpg` for the menu cards
- `interior.jpg` for the About section, which is not built yet

The restaurant's own photos are the best choice. Free libraries such as Unsplash and Pexels also work. Do not use photos copied from other websites, since most of them are copyrighted.

## Changing the menu

For now the menu lives in `data/menu.ts`. Each item has an id, a name, a description, a price in naira, a category and an image path. To add a dish, copy an existing item and edit it.

To add a new category, add it to the `category` type in the same file and to the `categories` list in `app/menu/page.tsx`.

Once Supabase is connected, the owner will edit the menu from the admin area and this file will no longer be needed.

## Project structure

```
app/
  page.tsx          home page
  menu/page.tsx     menu page
components/
  MenuCard.tsx      card for a single dish
data/
  menu.ts           sample menu data
public/
  images/           photos used on the site
```

## Commands

- `npm run dev` starts the site locally with live reloading
- `npm run build` makes a production build
- `npm run start` runs the production build
- `npm run lint` checks the code for common mistakes
