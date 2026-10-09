/** Terms of service. Linked from the footer, the sign-in pages and Google's consent screen. */
import Link from "next/link";
import { BrandMark } from "@/components/Icon";

export const metadata = { title: "Terms of service · Haulbook" };

const CONTACT = "dhritikumawat@gmail.com";

export default function Terms() {
  return (
    <div className="landing credits legal">
      <header className="l-header">
        <Link href="/" className="brand"><BrandMark /> Haulbook</Link>
      </header>
      <main>
        <h1 className="l-h2">Terms of service</h1>
        <p>Last updated 9 October 2026.</p>
        <p>By creating an account or using Haulbook, you agree to these terms.</p>

        <h2>The service</h2>
        <p>
          Haulbook is a tool for keeping track of products you review, with reminders for return windows, posting dates, refunds and payments.
          Reminders are a help, not a guarantee: always check deadlines with the shop or brand yourself. Haulbook is not responsible for a missed
          return, refund or payment.
        </p>

        <h2>Your account</h2>
        <ul>
          <li>Keep your sign-in details safe. You are responsible for what happens in your account.</li>
          <li>Give accurate details, and only add content you have the right to use.</li>
          <li>Don&apos;t misuse Haulbook: no attempts to break in, overload it, or reach other people&apos;s data.</li>
        </ul>

        <h2>Your content</h2>
        <p>
          What you add stays yours. You allow Haulbook to store and process it only to run the service for you, as described in the{" "}
          <Link href="/privacy">privacy policy</Link>.
        </p>

        <h2>Plans and prices</h2>
        <p>
          Haulbook has a free plan and a paid Pro plan, described on the <Link href="/pricing">pricing page</Link>. While payments are not live,
          Pro features are open to everyone. Before any charge, we will show the price and ask you to confirm.
        </p>

        <h2>Changes and ending</h2>
        <p>
          We may change Haulbook or these terms; if a change matters, we will tell you by email or in the app. You can stop using Haulbook at any
          time and ask us to delete your account. We may suspend accounts that break these terms.
        </p>

        <h2>Liability</h2>
        <p>
          Haulbook is provided as it is. To the extent the law allows, we are not liable for indirect losses, or for losses from relying on
          reminders or imported product details.
        </p>

        <h2>Contact</h2>
        <p>Questions: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. These terms are governed by the laws of India.</p>
        <p><Link href="/">Back to home</Link> · <Link href="/privacy">Privacy policy</Link></p>
      </main>
    </div>
  );
}
