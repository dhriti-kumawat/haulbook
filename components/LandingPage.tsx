/** The public marketing page, shown at / to signed-out visitors. */
import Image from "next/image";
import Link from "next/link";
import { BrandMark, Icon } from "./Icon";
import { HeroVisual } from "./HeroVisual";
import { FooterTry, StickyCta } from "./LandingClient";

/*
 * Every section reuses the hero's look: the soft pastel gradient ("grad"),
 * white cards with a lavender shadow, and tilted sticker badges.
 * Phone first: sections stack, the product types swipe, and a sticky bar keeps sign-up one tap away.
 */

function Photo({ src, size, className = "" }: { src: string; size: number; className?: string }) {
  return (
    <span className={`l-photo ${className}`} style={{ width: size, height: size }}>
      <Image src={src} alt="" fill sizes={`${size}px`} loading="eager" />
    </span>
  );
}

function SectionHead({ label, title, soft }: { label: string; title: string; soft: string }) {
  return (
    <div className="l-head">
      <span className="l-pill"><i />{label}</span>
      <h2 className="l-h2">{title} <span className="l-soft">{soft}</span></h2>
    </div>
  );
}

const ROWS = [
  { t: "Lakmé Gel Nail Color", meta: "Bought · Unboxed", chip: "Return in 2d", tone: "is-urgent", img: "/landing/nailpolish.jpg" },
  { t: "Kay Beauty Palette", meta: "PR · Filmed", chip: "Post in 3d", tone: "is-soon", img: "/landing/palette.jpg" },
  { t: "Bella Vita Date Perfume", meta: "Paid collab · Posted", chip: "Ask to pay", tone: "is-accent", img: "/landing/perfume.jpg" },
];

const PHONE = [
  { t: "Dot & Key Sunscreen", chip: "2d", tone: "is-urgent", img: "/landing/sunscreen.jpg" },
  { t: "Mamaearth Face Wash", chip: "3d", tone: "is-soon", img: "/landing/facewash.jpg" },
  { t: "Plum Body Lotion", chip: "5d", tone: "", img: "/landing/bodylotion.jpg" },
];

const FEATURES = [
  { t: "Add by link", d: "Paste a link. Name, photo and price fill in." },
  { t: "Return countdown", d: "Counts from delivery. Turns red before it closes." },
  { t: "A nudge, not a nag", d: "One email, only on days something is due." },
  { t: "Posting deadlines", d: "PR and collab dates with deliverables." },
  { t: "Refunds and payments", d: "See what's late and for how long." },
  { t: "Board, list or calendar", d: "Drag between steps or see the month." },
];

const KINDS = [
  { type: "bought", label: "Bought", line: "Return it in time", text: "Return window and refund follow-up.", img: "/landing/headphones.jpg", alt: "Headphones" },
  { type: "pr", label: "PR", line: "Post it on time", text: "Posting date, deliverables and post link.", img: "/landing/phone.jpg", alt: "Phone" },
  { type: "collab", label: "Paid collab", line: "Get paid for it", text: "Fee, deliverables and payment follow-up.", img: "/landing/vase.jpg", alt: "Ceramic vases" },
];

const FAQ = [
  {
    q: "Which shops does link import work with?",
    a: "Most online shops. If a shop blocks it, add the details yourself and upload a photo or a screenshot.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. Haulbook runs in your browser. On your phone you can add it to your home screen and open it like an app.",
  },
  {
    q: "Will I get a lot of emails?",
    a: "No. One short email, only on days something is due or newly late. Turn it off any time in Settings.",
  },
  {
    q: "Who can see my products?",
    a: "Only you. You can download everything as a spreadsheet at any time.",
  },
];

export function LandingPage() {
  return (
    <>
    <div className="landing">
      <header className="l-header">
        <Link href="/" className="brand"><BrandMark /> Haulbook</Link>
        <nav className="l-nav" aria-label="Account">
          <Link href="/auth/signin" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href="/auth/signup" className="btn btn-primary btn-sm">Get started</Link>
        </nav>
      </header>

      <main>
        <section className="l-hero">
          <div className="l-hero-text">
            <p className="l-eyebrow">For creators who review products</p>
            <h1>Review more. <span className="l-accent">Lose nothing.</span></h1>
            <p className="l-lead">
              Return windows, posting dates, refunds and brand payments for every product you review, counted down for you.
            </p>
            <div className="l-cta" id="hero-cta">
              <Link href="/auth/signup" className="btn btn-primary">Create your haulbook</Link>
              <a href="#why" className="btn btn-secondary">See how it works</a>
            </div>
            <p className="l-signin-hint">Already have an account? <Link href="/auth/signin">Sign in</Link></p>
          </div>

          <HeroVisual />
        </section>

        {/* 1 · Without vs with */}
        <section className="l-section" id="why">
          <SectionHead label="Why Haulbook" title="A calmer way to" soft="handle review products." />
          <div className="why">
            <div className="why-panel why-before" aria-label="Without Haulbook">
              <span className="why-label">Without Haulbook</span>
              <div className="why-shot" aria-hidden="true"><span className="why-shot-img"><Image src="/landing/roller.jpg" alt="" fill sizes="200px" loading="eager" /></span><b>IMG_4821.png</b><span>Order screenshot</span></div>
              <div className="why-note" aria-hidden="true"><b>Notes</b>lakmé nail return by ??<br />kay palette reel fri?<br />bella vita payment ask</div>
              <span className="l-sticker why-s1"><i className="dot-bad" />Window closed</span>
              <span className="l-sticker why-s2"><i className="dot-bad" />Refund lost</span>
            </div>
            <div className="why-panel why-after grad" aria-label="With Haulbook">
              <span className="why-label">With Haulbook</span>
              <span className="l-sticker why-s3" aria-hidden="true"><span className="l-sticker-icon"><Icon name="check" size={13} /></span>Refund back</span>
              <ul className="why-list">
                {ROWS.map((r) => (
                  <li key={r.t}>
                    <Photo src={r.img} size={40} />
                    <span className="why-text"><b>{r.t}</b><span>{r.meta}</span></span>
                    <span className={`deadline-chip ${r.tone}`}>{r.chip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 2 · Features as stickers around one product card */}
        <section className="l-section">
          <SectionHead label="Features" title="Everything one product needs," soft="on one card." />
          <div className="feat grad">
            <div className="feat-card" aria-hidden="true">
              <span className="feat-photo"><Image src="/landing/bag.jpg" alt="" fill sizes="340px" loading="eager" /></span>
              <div className="feat-body">
                <div className="feat-top"><b>Aldo Sofietta Bag</b><span className="deadline-chip is-urgent">Return in 2d</span></div>
                <span className="feat-meta">Bought · ₹5,999</span>
                <span className="feat-steps"><i className="is-done" /><i className="is-done" /><i className="is-done" /><i /><i /></span>
                <span className="feat-btn">Mark posted</span>
              </div>
            </div>
            <ul className="feat-list">
              {FEATURES.map((f, i) => (
                <li key={f.t} className={`feat-item feat-${i + 1}`}>
                  <b>{f.t}</b>
                  <span>{f.d}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3 · Product types as arch cards */}
        <section className="l-section">
          <SectionHead label="Every kind of product" title="Bought, gifted or paid." soft="All in one place." />
          <div className="arches" tabIndex={0} aria-label="Product types, scroll sideways for more">
            {KINDS.map((k) => (
              <article key={k.type} className={`arch arch-${k.type}`}>
                <h3>{k.label}</h3>
                <span className="arch-line">{k.line}</span>
                <span className="arch-photo"><Image src={k.img} alt={k.alt} fill sizes="190px" loading="eager" /></span>
                <p>{k.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 4 · Money band */}
        <section className="band grad">
          <div className="band-inner">
            <div className="band-copy">
              <h2 className="l-h2">Know where <span className="l-accent">every rupee is.</span></h2>
              <p>Money spent on products, refunds still pending and collab fees still due, adding up on their own.</p>
            </div>
            <div className="band-cards" aria-hidden="true">
              <div className="glass band-total">
                <span>Still to come back to you</span>
                <b className="num">₹24,580</b>
                <span className="band-bar"><i style={{ flex: 49 }} /><i style={{ flex: 12 }} /><i style={{ flex: 18 }} /></span>
                <span className="band-key"><em>To return</em><em>Refunds</em><em>Collab fees</em></span>
              </div>
              <div className="glass"><span>Due this week</span><b className="num band-small">3</b></div>
              <div className="glass band-late">
                <Photo src="/landing/candle.jpg" size={40} />
                <span><span>Iris Fragrances candle</span><b>Payment 10d late</b></span>
              </div>
            </div>
          </div>
        </section>

        {/* 5 · FAQ */}
        <section className="l-section faq-wrap" id="faq">
          <div className="l-head">
            <span className="l-pill"><i />Questions</span>
            <h2 className="l-h2">Good <span className="l-soft">to know.</span></h2>
          </div>
          <div className="faq">
            {FAQ.map((f, i) => (
              <details key={f.q} className="faq-item" open={i === 0}>
                <summary>
                  {f.q}
                  <Icon name="plus" size={16} />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

      </main>
    </div>

      {/* 6 · Footer: paste a link, see it land, sign up */}
      <FooterTry rows={PHONE} />

      <StickyCta />
    </>
  );
}
