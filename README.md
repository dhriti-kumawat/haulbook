# Haulbook

Haulbook is a product tracker for creators who review products. Each product is one of three kinds:
- **Bought**: you paid for it and may return it.
- **PR**: a brand sent it for free.
- **Paid collab**: a brand is paying you to post about it.

For every product, Haulbook shows the one next step: film it, post it, return it before the window closes, or chase the refund or payment.

## Features

- **Home**: the money still owed to you, counts of what to film, post and return, and a "Needs you" list sorted by deadline.
- **Products**:
  - List, Board and Calendar views.
  - On the board, drag cards between steps, or use the "Move to" menu.
  - Select several products to move or delete them at once.
- **Add by link**: paste an Amazon, Myntra, Flipkart or other product link, and the name, photo, price and shop fill in. You can also upload a photo.
- **Shops & brands**: a default return window per shop, and a printable report per brand with post links and fees.
- **Email reminders**: a short daily digest, sent only on days when something is due or newly late.
- **Accounts**: email and password sign-in with a forgot-password flow, plus optional Google sign-in.
- **Phone install**: Haulbook can be added to the home screen and shows an offline page when there is no connection.
- **Export**: download all products as a CSV file.

## Tech stack

Next.js 14 (App Router), React 18, TypeScript, PostgreSQL with Prisma, NextAuth.js, and plain CSS with design tokens (`app/globals.css`).

## Local setup

```bash
npm install
cp .env.local.example .env.local   # then fill in DATABASE_URL and NEXTAUTH_SECRET
cp .env.local .env                 # the Prisma CLI reads .env
npx prisma db push
npm run dev
```

Open http://localhost:3000.

- **Demo account:** `DATABASE_URL=… node scripts/seed-demo.mjs` creates one with example products. The login details are in that script.
- **Emails without a Resend key:** reminder and password-reset emails are not sent. They appear at http://localhost:3000/api/dev/outbox instead.
- **Reminder job by hand:** `curl http://localhost:3000/api/cron/reminders` runs it once (no secret is needed in development).
- **Landing page while signed in:** open http://localhost:3000/?preview=landing.

## Moving data from the old order tracker

Older versions stored orders and their items. To convert every item into a Bought product, run:

```bash
npx prisma db push
node scripts/orders-to-products.mjs
```

The script is safe to run more than once, and it does not touch the old tables.

## Going live

These steps need accounts that only you can create. See `docs/LAUNCH.md` for each one.

1. **Database:** create a Postgres database (for example Neon) and set `DATABASE_URL`.
2. **Hosting:** deploy on Vercel. Set `NEXTAUTH_URL` to your domain and generate a new `NEXTAUTH_SECRET`.
3. **Email:** create a Resend account, verify your sending domain, then set `RESEND_API_KEY` and `EMAIL_FROM`.
4. **Reminders:** set `CRON_SECRET`. `vercel.json` already runs the reminder job daily at 08:00 IST.
5. **Google sign-in (optional):** create an OAuth client in Google Cloud, then set `GOOGLE_ID` and `GOOGLE_SECRET`.
