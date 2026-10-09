# Launch checklist

Each step below needs an account that only the owner can create. The app already reads every setting listed here.

## 1. Database (Neon)

1. Create a project at https://neon.tech and copy its connection string.
2. Set it as `DATABASE_URL` on Vercel.
3. Create the tables from your machine: `DATABASE_URL="<neon url>" npx prisma db push`.

## 2. Hosting (Vercel)

1. Import the GitHub repository on https://vercel.com.
2. Set these environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`: for example `https://haulbook.app`
   - `NEXTAUTH_SECRET`: generate with `openssl rand -base64 32`
3. Add your domain under Project → Domains.

## 3. Email (Resend)

1. Create an account at https://resend.com.
2. Add your domain and create the DNS records it shows.
3. Create an API key and set `RESEND_API_KEY`.
4. Set `EMAIL_FROM`, for example `Haulbook <reminders@haulbook.app>`. The address must be on the domain you verified.
5. In the app, open Settings → "Send me a test email" to check delivery.

## 4. Daily reminders

1. Set `CRON_SECRET`: generate with `openssl rand -hex 32`.
2. `vercel.json` schedules `/api/cron/reminders` at 02:30 UTC (08:00 IST). Vercel sends the secret on every call automatically.
3. Each user gets at most one email per day, and only when something is due or newly late.

## 5. Google sign-in (recommended)

The fastest way in: one tap creates the account or signs in. It's the first option on both pages.

1. In Google Cloud Console (console.cloud.google.com), create a project, then go to
   APIs & Services → OAuth consent screen. Choose "External", add the app name (Haulbook),
   your support email and logo, and the scopes `email` and `profile`. Publish it ("In production")
   so anyone can sign in, not just test users.
2. APIs & Services → Credentials → Create credentials → OAuth client ID → "Web application".
3. Authorised JavaScript origins: `https://<your-domain>` (and `http://localhost:3000` for local testing).
   Authorised redirect URIs: `https://<your-domain>/api/auth/callback/google`
   (and `http://localhost:3000/api/auth/callback/google`).
4. Copy the client ID and secret into `GOOGLE_ID` and `GOOGLE_SECRET` (Vercel and `.env.local`), then restart.

Someone who signed up with email and password can later use Google with the same address; it opens
the same account. Errors (cancelled, Google unreachable) come back to the sign-in page with a message.

## 6. Instagram sign-in (optional)

The Instagram button shows only when both keys are set. Instagram only allows sign-in for
Business and Creator accounts; personal accounts see an error and can use another option.

1. At developers.facebook.com, create an app of type "Business", then add the product
   "Instagram" and choose "API setup with Instagram login".
2. Under "Set up Instagram business login", add the redirect URL
   `https://<your-domain>/api/auth/callback/instagram` (and `http://localhost:3000/api/auth/callback/instagram`).
3. Copy the Instagram app ID and secret (not the Facebook app ID) into `INSTAGRAM_CLIENT_ID`
   and `INSTAGRAM_CLIENT_SECRET`, then restart.
4. Until Meta approves the app (App Review, `instagram_business_basic`), only accounts you add
   as testers under App roles can sign in.

Instagram does not share an email address, so these accounts get push notifications but not email reminders.

## 7. Phone code sign-in (optional)

Users enter an Indian mobile number and get a 6-digit code by SMS. A new number creates an account.

1. Create a Twilio account, then Verify → Services → Create a service named Haulbook (SMS channel).
2. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_VERIFY_SID` (the service's `VA…` ID).
3. Each number can request 4 codes an hour, and each address 10, to limit SMS costs.

In development without these keys, the code is printed in the server log
(`[phone-auth] Development code for …`) instead of being sent.

## Known limits to revisit as you grow

- **Uploaded photos** are stored inside the database as small JPEGs (about 800px, under 300 KB each). At scale, move them to file storage such as Vercel Blob or S3.
- **Link import:** some shops (for example Nykaa, and sometimes Flipkart) block automated page reads. Users can upload a photo instead.

## Link import

Pasting a product link reads the shop page directly first. When a shop blocks that, or builds its
page with JavaScript, Haulbook asks two fallback readers, in order:

1. **Jina Reader** (`r.jina.ai`, open source). Free without a key at about 20 links a minute.
   A free key from jina.ai raises the limit: set `READER_API_KEY`. To keep links off third-party
   servers, run your own copy of github.com/jina-ai/reader and set `READER_URL` to it, or set
   `READER_URL=off`.
2. **Microlink** (`api.microlink.io`). About 50 free links a day; `MICROLINK_API_KEY` for more,
   `MICROLINK=off` to turn it off.

Only public product links are ever sent, and only when the direct read didn't get the name and photo.
Mention this in the privacy policy. If every reader fails, Add product says so and keeps the name
from the link or the shop app's share text.

## Phone notifications (Web Push)

Reminders can also arrive as notifications on phones and computers, sent by the same daily job as
the email digest (one digest per person per day, by email and/or notification).

1. Generate a key pair once: `npx web-push generate-vapid-keys`.
2. In Vercel, set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT`
   (`mailto:` your support address). Keep the private key secret, and don't change the pair later:
   new keys sign everyone out of notifications.
3. Run `npx prisma db push` for the new `PushSubscription` table.

People turn it on in Settings → Phone notifications. Android, Windows and Mac browsers work directly.
iPhones (iOS 16.4+) need Haulbook added to the Home Screen first; the card shows those steps.
Devices that uninstall or block notifications are removed automatically on the next send.

## Voice add (AI)

Add product has "Or just say it": the creator taps the mic and describes the product
("got the boAt headphones from Amazon for 1999, return in 7 days"). The browser turns speech into
text (Chrome, Edge and Safari; others get a "Type instead" box), then Claude (`claude-opus-5-5`,
low effort, structured output) fills the form fields for the creator to check.

1. Create an API key at console.anthropic.com and set `ANTHROPIC_API_KEY` in Vercel.
2. Each description is one short request. Limit: 40 per person per hour.

Without the key, a simple built-in reader still picks out the name, shop, price and return days.
What the creator says is sent to Anthropic for this; mention it in the privacy policy.

## Free and Pro plans

| Free | Pro |
|---|---|
| Up to 25 products in progress | Unlimited |
| Email reminders | + phone notifications and WhatsApp reminders |
| List and board views | + calendar, brand reports, CSV export |
| | Earnings by financial year, invoices and payment follow-ups |

Pricing shown on the site: Pro ₹199/month, ₹99/month for early access (constants `PRO_PRICE` and `PRO_EARLY_PRICE` in `lib/plan.ts`). Until payments are added, `PLAN_LIMITS` is unset, so every account has Pro features unlocked and nothing is limited; Settings and
the Free/Pro page say so. To start enforcing, set `PLAN_LIMITS=on` in Vercel. Accounts with
`plan = 'pro'` in the `User` table keep everything; until payments exist, set that by hand in Supabase.
Limits are checked on the server (adding a product past 25, CSV export, notifications, invoices) and the
app shows a "Pro" card instead of locked screens.

## WhatsApp reminders

Uses Meta's WhatsApp Cloud API. Off until configured; Settings shows "Coming soon" until then.

1. In Meta Business Manager, create a WhatsApp Business account and add a sending number.
2. Create a message template named `haulbook_digest` (category Utility, language English) whose body
   has one parameter, e.g. `Haulbook reminder: {{1}}`, and wait for Meta to approve it.
3. Create a permanent access token for a system user with `whatsapp_business_messaging`.
4. Set `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` (and `WHATSAPP_TEMPLATE` / `WHATSAPP_TEMPLATE_LANG`
   if different) in Vercel.

People turn it on in Settings with their number and a consent tick box (stored as `whatsappOptInAt`);
the daily reminder job then sends the same digest there. Meta charges per message; check its pricing.
