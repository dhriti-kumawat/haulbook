# Haulbook

Haulbook is a product tracker for creators who review products. Each product is one of three kinds:
- **Bought**: you paid for it and may return it.
- **PR**: a brand sent it for free.
- **Paid collab**: a brand is paying you to post about it.

For every product, Haulbook shows the one next step: film it, post it, return it before the window closes, or chase the refund or payment.

## Features

- **Home**: what needs you this week, the money still owed to you, counts of what to film, post and return, and a "Needs you" list sorted by deadline.
- **Products**:
  - List, Board and Calendar views. Finished products fold into a "Done" group.
  - Each card shows its step ("To film", "To post"…) as a button that moves it to another step.
  - On phones, swipe a card right to do its next step, or left to move it. Pull down to refresh.
  - Select several products to move or delete them at once, with undo.
  - Ticking a step keeps the rest consistent: ticking "Posted" also ticks "Delivered" and "Filmed".
- **Product details**: edit everything in one panel. Problems show next to the field, and closing the panel saves your changes.
- **Add by link**: paste a product link from almost any shop, and the name, photo, price and shop fill in. Shops that block automatic reading fall back to Jina Reader and Microlink. Pasting a shop app's share text keeps the product name, and long names get a "use a shorter name" suggestion. Upload a photo or screenshot when a shop can't be read.
- **Voice add**: tap the mic in Add product and describe the product ("got the boAt headphones from Amazon for 1999, return in 7 days"); AI fills in the form for you to check. "Type instead" works where the browser can't listen.
- **Share to Haulbook**: on Android, once installed, Haulbook appears in the share sheet of shop apps.
- **Earnings** (Pro): collab fees earned and due, refunds recovered and pending, value of PR products received, and per-brand totals for each Indian financial year (April to March), with a CSV for tax time.
- **Invoices and payment follow-ups** (Pro): a numbered, printable invoice for each paid collab using your billing details, and a ready payment reminder to copy, email or send on WhatsApp.
- **Free and Pro**: Free covers up to 25 products in progress with email reminders, list and board views. Pro adds unlimited products, phone and WhatsApp reminders, calendar, brand reports, CSV export, earnings and invoices. Pro costs ₹199 a month, ₹99 during early access; until payments open, every account has Pro features unlocked.
- **Shops & brands**: set each shop's return window in one tap, and print a report per brand with post links and fees.
- **Reminders**: a short daily digest, sent only on days something is due or newly late, by email and/or as a phone or browser notification.
- **Accounts**: one-tap Google sign-in, Instagram (Business and Creator accounts), a code sent by SMS to a mobile number, or email and password with a forgot-password flow. In Settings, people can add a confirmed email or phone number and connect Google or Instagram to the same account.
- **Help**: all questions, grouped, at /help; the landing page shows the main ones.
- **Landing page**: visitors can paste a product link before signing up; it is waiting in Add product after they sign up.
- **Phone install**: Haulbook can be added to the home screen and shows an offline page when there is no connection.
- **Export**: download all products as a CSV file.

## Tech stack

Next.js 15 (App Router), React 19, TypeScript, PostgreSQL with Prisma, NextAuth.js 4, Web Push (`web-push`), Claude API for voice add (`@anthropic-ai/sdk`), and plain CSS with design tokens (`app/globals.css`).

## Local setup

```bash
npm install
cp .env.local.example .env.local   # then fill in DATABASE_URL and NEXTAUTH_SECRET
cp .env.local .env                 # the Prisma CLI reads .env
npx prisma db push
npm run dev
```

Open http://localhost:3000.

- **Demo account:** `DATABASE_URL=postgresql://localhost/haulbook node scripts/seed-demo.mjs` creates one with example products. It only runs against a local database. The login details are in that script.
- **Emails without a Resend key:** reminder and password-reset emails are not sent. They appear at http://localhost:3000/api/dev/outbox instead.
- **Notifications:** generate keys with `npx web-push generate-vapid-keys`, add them to `.env.local`, then turn them on in Settings.
- **Reminder job by hand:** `curl http://localhost:3000/api/cron/reminders` runs it once (no secret is needed in development).
- **Landing page while signed in:** open http://localhost:3000/?preview=landing.

## Moving data from the old order tracker

Haulbook was rebuilt from an order tracker that stored orders and their items. To convert every item into a Bought product, run:

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
5. **Google sign-in:** create an OAuth client in Google Cloud, then set `GOOGLE_ID` and `GOOGLE_SECRET`.
6. **Instagram and phone sign-in (optional):** set `INSTAGRAM_CLIENT_ID`/`INSTAGRAM_CLIENT_SECRET` (Meta app) and `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_VERIFY_SID` (Twilio Verify).
7. **Notifications:** set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT`.
8. **Voice add:** set `ANTHROPIC_API_KEY`. Without it, a simpler built-in reader fills in what it can.
9. **Link import (optional):** set `READER_API_KEY` and `MICROLINK_API_KEY` for higher limits.

## Branches

Only two branches: `dev` (where work is committed) and `main` (production; Vercel deploys it). Release by opening a pull request from `dev` into `main`. CI runs the type check, build and security audit on both.
