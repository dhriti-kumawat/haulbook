/** The public marketing page, shown at / to signed-out visitors. */
import Image from "next/image";
import Link from "next/link";
import { BrandMark, Icon } from "./Icon";
import { HeroVisual } from "./HeroVisual";
import { MAIN_FAQ } from "@/lib/faq";
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
  { type: "collab", label: "Paid collab", line: "Get paid for it", text: "Deliverables, earnings and payment follow-up.", img: "/landing/vase.jpg", alt: "Ceramic vases" },
];


export function LandingPage() {
  return (
    <>
    <div className="landing">
      <header className="l-header">
        <Link href="/" className="brand"><BrandMark /> Haulbook</Link>
        <nav className="l-nav" aria-label="Account">
          <Link href="/pricing" className="btn btn-ghost btn-sm l-nav-pricing">Pricing</Link>
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

        {/* 3 · Voice add */}
        <section className="l-section split">
          <div className="split-copy">
            <span className="l-pill is-new"><i />New · Voice add</span>
            <h2 className="l-h2">Say it. <span className="l-soft">It&apos;s added.</span></h2>
            <p>Unboxing on camera? Tap the mic and say what it is, where it&apos;s from and when it&apos;s due. Haulbook fills in the rest. English or Hinglish.</p>
            <div className="split-tags">
              {["Name and brand", "Price or fee", "Return window", "Post-by date", "Deliverables"].map((t) => <span key={t} className="deadline-chip">{t}</span>)}
            </div>
          </div>
          <div className="split-visual grad voice-demo" aria-hidden="true">
            <span className="l-sticker vd-sticker"><span className="vd-hi">हि</span>Works in Hinglish</span>
            <div className="vd-card">
              <div className="vd-live">
                <span className="vd-dot" />
                <span className="vd-text">&ldquo;Got the <b>boAt headphones</b> from <b>Amazon</b> for <b>1999</b>, return in <b>7 days</b>&rdquo;</span>
                <span className="vd-done">Done</span>
              </div>
              <p className="vd-ok"><Icon name="check" size={13} /> Filled in name, type, shop, price, return window</p>
              <div className="vd-fields">
                <span className="vd-field"><Photo src="/landing/headphones.jpg" size={34} /><span><em>Product name</em><b>boAt Rockerz 550</b></span></span>
                <span className="vd-field"><span className="vd-ico">A</span><span><em>Shop</em><b>Amazon</b></span></span>
                <span className="vd-field"><span className="vd-ico is-soon">₹</span><span><em>Price paid</em><b>₹1,999</b></span></span>
                <span className="vd-field"><span className="vd-ico is-urgent">7</span><span><em>Return window</em><b>7 days</b></span></span>
              </div>
            </div>
          </div>
        </section>

        {/* 4 · Product types as arch cards */}
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

        {/* 5 · Earnings and invoices */}
        <section className="l-section split is-flipped">
          <div className="split-visual grad earn-demo" aria-hidden="true">
            <div className="ed-card">
              <div className="ed-top"><b>Earnings</b><span className="deadline-chip">FY 2026-27</span></div>
              <span className="ed-label">Collab earnings</span>
              <b className="ed-total num">₹1,24,000</b>
              <span className="ed-label">₹18,000 still due · ₹9,450 refunds back</span>
              <span className="ed-bars">{[20, 45, 30, 70, 55, 100, 40].map((h, i) => <i key={i} className={h >= 70 ? "is-hi" : ""} style={{ height: `${h}%` }} />)}</span>
            </div>
            <div className="ed-invoice">
              <em>INVOICE #0007</em>
              <b>Minimalist · 2 Reels</b>
              <span className="ed-sum"><span>Total</span><b>₹12,000</b></span>
              <span className="ed-label">UPI: you@okbank</span>
            </div>
            <span className="l-sticker ed-sticker"><span className="l-sticker-icon"><Icon name="check" size={13} /></span>Payment reminder sent</span>
          </div>
          <div className="split-copy">
            <span className="l-pill"><i />For paid collabs</span>
            <h2 className="l-h2">Know what <span className="l-soft">you earned.</span></h2>
            <p>Collab earnings, refunds and gifted products add up by financial year, ready for tax time. Send a proper invoice in a tap, and a polite nudge when a brand pays late.</p>
            <ul className="split-points">
              <li><span className="sp-ico">₹</span>Collab earnings and what&apos;s still due, per brand</li>
              <li><span className="sp-ico">#</span>Numbered invoices with your UPI or bank details</li>
              <li><span className="sp-ico"><Icon name="send" size={13} /></span>Payment reminder by email or WhatsApp</li>
            </ul>
          </div>
        </section>

        {/* 6 · Free and Pro */}
        <section className="l-section">
          <SectionHead label="Plans" title="Start free." soft="Grow into Pro." />
          <div className="plans">
            <div className="plan">
              <h3>Free <span className="plan-price">₹0</span></h3>
              <p>For getting every review on track.</p>
              <ul>{["Up to 25 products in progress", "Add by link or by voice", "Email reminders", "List and board views"].map((t) => <li key={t}><Icon name="check" size={14} />{t}</li>)}</ul>
              <div className="plan-actions"><Link href="/auth/signup" className="btn btn-secondary">Start free</Link></div>
            </div>
            <div className="plan is-pro grad">
              <span className="l-sticker plan-sticker"><span className="l-sticker-icon"><Icon name="check" size={13} /></span>₹99/mo early access</span>
              <h3>Pro <span className="plan-price"><s>₹199</s> ₹99<em>/month</em></span></h3>
              <p>For creators running paid collabs.</p>
              <ul>{["Unlimited products", "Phone and WhatsApp reminders", "Calendar, brand reports, CSV export", "Earnings by financial year", "Invoices and payment reminders"].map((t) => <li key={t}><Icon name="check" size={14} />{t}</li>)}</ul>
              <div className="plan-actions"><Link href="/pricing" className="btn btn-primary">See Pro plan details</Link></div>
            </div>
          </div>
          <div className="plans-more"><Link href="/pricing" className="btn btn-quiet btn-sm">Compare all features <Icon name="chevronRight" size={14} /></Link></div>
        </section>

        {/* 7 · FAQ: the main questions; the rest are on /help */}
        <section className="l-section faq-wrap" id="faq">
          <div className="l-head">
            <span className="l-pill"><i />Questions</span>
            <h2 className="l-h2">Good <span className="l-soft">to know.</span></h2>
          </div>
          {/* Two independent columns: opening an answer only pushes down the questions under it. */}
          <div className="faq faq-cols">
            {[MAIN_FAQ.slice(0, 3), MAIN_FAQ.slice(3, 6)].map((col, c) => (
              <div key={c} className="faq-col">
                {col.map((f, i) => (
                  <details key={f.q} className="faq-item" open={c === 0 && i === 0}>
                    <summary>
                      {f.q}
                      <Icon name="plus" size={16} />
                    </summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            ))}
          </div>
          <div className="faq-more"><Link href="/help" className="btn btn-secondary btn-sm">See all questions <Icon name="chevronRight" size={14} /></Link></div>
        </section>

      </main>
    </div>

      {/* 6 · Footer: paste a link, see it land, sign up */}
      <FooterTry rows={PHONE} />

      <StickyCta />
    </>
  );
}
