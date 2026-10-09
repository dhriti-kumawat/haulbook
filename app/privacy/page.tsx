/** Privacy policy. Linked from the footer, the sign-in pages and Google's consent screen. */
import Link from "next/link";
import { BrandMark } from "@/components/Icon";

export const metadata = { title: "Privacy policy · Haulbook" };

const CONTACT = "dhritikumawat@gmail.com";

export default function Privacy() {
  return (
    <div className="landing credits legal">
      <header className="l-header">
        <Link href="/" className="brand"><BrandMark /> Haulbook</Link>
      </header>
      <main>
        <h1 className="l-h2">Privacy policy</h1>
        <p>Last updated 9 October 2026.</p>
        <p>
          Haulbook helps creators keep track of the products they review: return windows, posting dates, refunds and brand payments.
          This page explains what Haulbook stores, why, and who else handles it.
        </p>

        <h2>What we store</h2>
        <ul>
          <li><b>Your account:</b> your name, email address, mobile number and profile photo, depending on how you sign in. If you use a password, only a scrambled (hashed) version is stored.</li>
          <li><b>What you add:</b> products, shop links, photos you upload, dates, amounts, brands, notes and post links.</li>
          <li><b>Invoice details</b> you choose to fill in, such as your name, address, UPI ID, bank details, GSTIN and PAN.</li>
          <li><b>Reminder settings:</b> your reminder choices, browser notification subscriptions and, if you turn it on, your WhatsApp number and consent.</li>
        </ul>
        <p>We do not sell your data, show ads, or use your data to train AI models.</p>

        <h2>Signing in with Google or Instagram</h2>
        <p>
          With Google, Haulbook receives your name, email address and profile photo, and uses them only to create and sign in to your account.
          With Instagram, it receives your username, name and profile photo, for the same purpose. Haulbook does not read your posts, messages,
          contacts or anything else in those accounts.
        </p>
        <p>
          Haulbook&apos;s use of information received from Google APIs adheres to the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">Google API Services User Data Policy</a>,
          including the Limited Use requirements.
        </p>

        <h2>Services that handle your data</h2>
        <ul>
          <li><b>Vercel</b> hosts the website.</li>
          <li><b>Supabase</b> stores the database, in its Mumbai (India) region.</li>
          <li><b>Resend</b> sends emails such as reminders and sign-in codes.</li>
          <li><b>Twilio</b> sends sign-in codes by SMS, if you sign in with your phone.</li>
          <li><b>Meta (WhatsApp)</b> delivers reminders, only if you turn WhatsApp reminders on.</li>
          <li><b>Anthropic</b> turns what you say in &ldquo;Add by voice&rdquo; into product details. Only the text of what you said is sent.</li>
          <li><b>Jina Reader and Microlink</b> may receive a product link you paste, to read the product name, photo and price when a shop blocks a direct read.</li>
        </ul>

        <h2>Cookies</h2>
        <p>Haulbook uses one cookie to keep you signed in. There are no advertising or tracking cookies.</p>

        <h2>Your choices</h2>
        <ul>
          <li>Download all your products as a CSV file from Settings.</li>
          <li>Turn email, phone and WhatsApp reminders off in Settings at any time.</li>
          <li>
            To delete your account and everything in it, email <a href={`mailto:${CONTACT}`}>{CONTACT}</a> from the address on your account,
            or tell us your sign-in phone number. We delete it within 30 days.
          </li>
        </ul>

        <h2>Contact</h2>
        <p>Questions about privacy: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
        <p><Link href="/">Back to home</Link> · <Link href="/terms">Terms of service</Link></p>
      </main>
    </div>
  );
}
