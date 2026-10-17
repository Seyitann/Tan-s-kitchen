# Putting Tan's Kitchen online with Vercel

You need three free accounts: GitHub (holds the code), Supabase (holds accounts and orders) and Vercel (runs the website). Set aside about an hour for the first time.

## Two things to know first

Vercel's free Hobby plan is for personal, non-commercial use only. Its rules say any business use needs the Pro plan. A restaurant taking orders is business use. Hobby is fine while you build and demo the site. Before real customers order, move to Pro, which is about $20 a month and is paid by card in US dollars. Check Vercel's pricing page for the current figure, and check that your card can pay in dollars.

Supabase free projects pause after about a week of low activity, and a paused project means orders and logins fail until someone restores it. Daily orders usually keep it awake, but a quiet week can pause it. Supabase's Pro plan does not pause. Check their pricing page before launch.

## 1. Put the code on GitHub

1. In VS Code, open the project folder. It must be the folder that contains `package.json`.
2. Check that `.gitignore` has a line `.data/`. The default file already ignores `.env.local`, which holds your secrets, so those never reach GitHub.
3. Open Source Control (Ctrl+Shift+G), type a message, press Commit, then Publish Branch. Pick a private repository.

## 2. Set up Supabase

1. Create a project at supabase.com. Choose the region closest to Nigeria in the list, and save the database password somewhere safe.
2. Open the SQL Editor, choose New query, paste everything from `supabase/schema.sql`, and press Run. This creates the two tables and locks them so nobody can reach them from a browser.
3. Open Project Settings, then API (or API Keys). Copy the Project URL and the secret key. Older projects call the secret key the service_role key. It can read and write everything, so it goes only into Vercel's settings. Never put it in code, in a message, or in a variable that starts with `NEXT_PUBLIC_`.

## 3. Deploy the site on Vercel

1. At vercel.com choose Add New, then Project, and import your GitHub repository. Vercel detects Next.js by itself.
2. Before pressing Deploy, open Environment Variables and add these:

| Name | Value |
|---|---|
| `SESSION_SECRET` | A long random string, at least 32 characters. Make one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SUPABASE_URL` | The Project URL from step 2 |
| `SUPABASE_SECRET_KEY` | The secret key from step 2 |
| `RESTAURANT_PHONE` | The phone that gets order alerts, like 08031234567 |
| `NEXT_PUBLIC_RESTAURANT_WHATSAPP` | The restaurant's WhatsApp number, digits with country code, like 2348031234567 |

3. Add the `TERMII_...` variables from `env.local.example` too, once you have a Termii account. Without them the site still works, but messages are only written to the logs and not sent.
4. Press Deploy. The first build takes a minute or two.

Any time you change an environment variable, redeploy afterwards (Deployments, then the three dots, then Redeploy). The `NEXT_PUBLIC_` ones are fixed in at build time, so they need a fresh build.

## 4. Test the live site

1. Open the address Vercel gives you, which ends in `.vercel.app`.
2. Create an account, add a dish, check out and place an order.
3. In Supabase, open Table Editor. Your customer is in `customers` and the order is in `orders`. Until there is an owner page, this is where the restaurant can see every order.
4. In Vercel, open your project's Logs. Without Termii keys you will see lines starting `[messages:test mode]`. That confirms the message step ran.

## 5. Make it quicker

By default Vercel runs your server code in Washington, D.C. Orders and logins talk to Supabase from there, so put them close together. In Vercel, open Settings, then Functions, and choose the region nearest your Supabase region.

## 6. Your own address

In Vercel, open Settings, then Domains, and add your domain. Vercel shows the records to enter at the company where you bought the domain. It can take a while to start working.

## If something goes wrong

- The build fails with "Module not found". Vercel runs Linux, which treats `Footer.tsx` and `footer.tsx` as different files. Make sure the file names match exactly what the code imports, including capital letters.
- Signing up gives an error. Open Logs in Vercel. A message saying the site is running without a database means `SUPABASE_URL` or `SUPABASE_SECRET_KEY` is missing or has a typo. Fix it, then redeploy.
- Everything worked and then stopped. Check whether Supabase paused the project.

## Before real customers use it

- Replace the placeholder pictures in `public/images` with real photos, and keep each file small.
- Phone numbers are not verified at sign-up. A text-message code at sign-up is the fix, so add one before launch.
- Add a short privacy note explaining that you use customers' numbers to message them about orders.
- Build the owner page for orders, so the restaurant does not depend on messages alone.
