# Orders, logins and messages: setup notes

## What happens when someone orders

A customer logs in, checks out, and the order is saved. Then four messages go out:

- an SMS to the customer
- a WhatsApp message to the customer
- an SMS to the restaurant
- a WhatsApp message to the restaurant

The order is saved before any message is sent. If a message fails, the order still stands and the confirmation page says which message did not go through.

## Test mode (the default)

With no `TERMII_API_KEY` in `.env.local`, nothing is sent. The messages are printed in the terminal where `npm run dev` is running, so you can test the whole flow for free. The confirmation page marks them "Test mode, not really sent".

## Turning on real messages with Termii

The site uses Termii (termii.com), a Nigerian messaging service that handles SMS and WhatsApp through one account.

1. Create a Termii account. In the dashboard, copy your API key and your base URL. Base URLs can differ between accounts, so paste yours into `TERMII_BASE_URL`.
2. SMS. Ask Termii for a sender ID, which is the name that shows as the sender. Approval takes some time. Until it comes through, leave `TERMII_SENDER_ID` empty and the site uses Termii's number route, which needs no sender ID. If messages do not reach people who have Do Not Disturb switched on, ask Termii about the `dnd` route and set `TERMII_SMS_CHANNEL=dnd`.
3. WhatsApp. WhatsApp only lets a business start a chat with an approved template. In the Termii dashboard, set up a WhatsApp device (under Manage Device), then request the two templates below. Copy the device ID and both template IDs into `.env.local`.
4. Restart `npm run dev`, place a test order with your own number, and check your phone.

### The two templates to request

Use Termii's template form and mark each blank the way the form shows. The blanks must be in this order, because the site fills them by number.

Restaurant alert (category: utility)

> New order [1] from [2] ([3]). Items: [4]. Total: [5]. [6]

Customer confirmation (category: utility)

> Hello [1], Tan's Kitchen has received your order [2]. Total: [3]. Thank you for ordering with us!

If Termii's form names the blanks differently, change the numbers in `lib/messages.ts` to match.

### Cost

Every SMS costs credit. WhatsApp through a provider usually has a platform fee plus a per-message charge from Meta. Check Termii's current price page before you launch, and set a low-balance alert so alerts to the restaurant never stop silently.

### Not tested against Termii itself

The message requests follow Termii's published docs and were tested against a stand-in server, not Termii. If a message fails, the terminal prints Termii's reply and the order page says "Could not be sent". That reply tells you what to fix.

## The free option

The order confirmation page has a "Message us on WhatsApp" button. It opens WhatsApp with the order already typed out, addressed to the restaurant. It costs nothing and needs no approval, but the customer has to tap send. Set the restaurant's number in `NEXT_PUBLIC_RESTAURANT_WHATSAPP`, digits only with the country code.

## Before you go live

- Phone numbers are not verified. Anyone can create an account with any number, so someone could trigger order texts to another person's phone. Orders are limited to five per hour per account, but a text-message code at sign-up is the real fix. Termii has a token service for this.
- Storage is a local file on your computer. Accounts and orders live in `.data/db.json` while you test, so add `.data/` to `.gitignore`. The live site stores them in Supabase instead. DEPLOY.md has the steps.
- There is no owner dashboard yet. The restaurant sees orders only through the messages. A private page listing orders is the next thing to build.
- The order limit (five an hour per account) is counted from saved orders, so it holds on the live site. The login attempt limit is remembered in memory only, so it is per server and resets on restart.
- Payment is on delivery. Checkout says so. Online payment (Paystack) is a later step.
- Tell customers how you use their number. Add a short privacy note on sign-up explaining that you message them about orders.
