import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark, Icon } from "@/components/Icon";
import { FAQ_GROUPS } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Help · Haulbook",
  description: "Answers about Haulbook: getting started, reminders, earnings and invoices, and privacy.",
};

/** All questions, grouped. Public, so it works from the landing page and inside the app. */
export default function HelpPage() {
  return (
    <div className="landing help">
      <header className="l-header">
        <Link href="/" className="brand"><BrandMark /> Haulbook</Link>
        <nav className="l-nav" aria-label="Account">
          <Link href="/home" className="btn btn-ghost btn-sm">Open Haulbook</Link>
        </nav>
      </header>
      <main>
        <div className="l-head help-head">
          <span className="l-pill"><i />Help</span>
          <h1 className="l-h2">Questions, <span className="l-soft">answered.</span></h1>
        </div>
        <nav className="help-jump" aria-label="Topics">
          {FAQ_GROUPS.map((g) => <a key={g.title} href={`#${g.title.toLowerCase().replace(/\W+/g, "-")}`}>{g.title}</a>)}
        </nav>
        {FAQ_GROUPS.map((g) => (
          <section key={g.title} id={g.title.toLowerCase().replace(/\W+/g, "-")} className="help-group">
            <h2>{g.title}</h2>
            <div className="faq">
              {g.items.map((f) => (
                <details key={f.q} className="faq-item">
                  <summary>{f.q}<Icon name="plus" size={16} /></summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
        <p className="help-more muted">Still stuck? <Link href="/credits">Credits</Link> · <Link href="/">Home page</Link></p>
      </main>
    </div>
  );
}
