# Noordons Books

A warm, editorial online bookstore built with Next.js App Router and MongoDB.

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- MongoDB with Mongoose
- Stripe Checkout
- Cookie-based auth with JWT sessions

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and point it at your MongoDB and Stripe accounts:

```bash
cp .env.example .env.local
```

3. Configure auth and bootstrap admin credentials in `.env.local`:

- `AUTH_SECRET` for signing session cookies
- `ADMIN_EMAIL` for the admin login
- `ADMIN_PASSWORD` for the admin password
- `ADMIN_NAME` for the admin display name
- `NEXT_PUBLIC_SITE_URL` for canonical and social-share URLs
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` for the client-facing cloud name
- `CLOUDINARY_URL` for signed server-side cover uploads from the admin dashboard

4. Start the app:

```bash
npm run dev
```

5. If your MongoDB database is empty, seed the sample catalog after the dev server is running:

```bash
curl -s -X POST http://localhost:3000/api/seed
```

6. Forward Stripe webhooks to the local app while testing checkout:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` signing secret printed by the Stripe CLI into
`STRIPE_WEBHOOK_SECRET` in `.env.local`, then restart the dev server.

## Pages

- `/` home page with featured shelves and staff picks
- `/books` searchable catalog with genre filters
- `/books/[slug]` detail page for each title
- `/about` brand and storefront story page
- `/cart` client-side cart with quantity controls
- `/contact` contact page with MongoDB-backed message form
- `/login` sign-in page
- `/register` sign-up page
- `/dashboard` authenticated user dashboard
- `/admin` authenticated admin dashboard
- `/api/admin/books` POST endpoint for admin product creation with image upload or image URL
- `/api/contact` POST endpoint for contact form submissions
- `/checkout/success` Stripe return page for successful payment
- `/checkout/cancel` Stripe return page for canceled payment
- `/api/auth/login` POST login endpoint
- `/api/auth/logout` POST logout endpoint
- `/api/auth/register` POST registration endpoint
- `/api/auth/session` current-session endpoint
- `/api/books` JSON catalog endpoint
- `/api/books/[slug]` JSON detail endpoint
- `/api/checkout` POST endpoint that creates Stripe Checkout sessions
- `/api/seed` POST endpoint to seed sample books into MongoDB
- `/api/webhooks/stripe` Stripe webhook endpoint that records completed orders

## Importing CSV Books

If a CSV in `src/data` includes an `image_url` column, you can bulk import it
into MongoDB with:

```bash
npm run import:csv-books
```

The importer scans `src/data`, finds CSV files that already include image URLs,
and upserts them into the `books` collection by ISBN.

## Notes

- If `MONGODB_URI` is not set, the UI falls back to the bundled sample catalog so the app still renders locally.
- Once MongoDB is configured and seeded, pages and API routes read from the database.
- The admin dashboard includes a live product form and inventory table. Cover uploads are sent to Cloudinary and the returned hosted image URL is saved in MongoDB.
- The site now includes About and Contact pages, shared social links, social card metadata, and share actions on book detail pages.
- `STRIPE_SECRET_KEY` is required before the checkout button can create a hosted Stripe session.
- `STRIPE_WEBHOOK_SECRET` is required if you want completed Stripe sessions written back into MongoDB as `Order` documents.
- `AUTH_SECRET` should be a long random string in real deployments.
- Admin credentials are bootstrapped from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. If you do not override them, the development defaults are `admin@noordonsbooks.local` and `Admin123456!`.

## Stripe Webhook Setup

Use the existing webhook route at `/api/webhooks/stripe`.

### Local development

1. Put a valid Stripe secret key in `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
```

2. Start the app:

```bash
npm run dev
```

3. Log in to the Stripe CLI and forward events to the local webhook route:

```bash
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded --forward-to localhost:3000/api/webhooks/stripe
```

4. Copy the `whsec_...` value printed by the CLI into `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

5. Restart the dev server after updating env vars.

6. Complete a real test checkout in the app using a Stripe test card such as `4242 4242 4242 4242`.

### Production

1. In Stripe Workbench, create a webhook endpoint pointing to:

```text
https://YOUR_DOMAIN/api/webhooks/stripe
```

2. Listen for:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

3. Reveal the signing secret for that endpoint and set it as:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

4. Deploy with both `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` set.
