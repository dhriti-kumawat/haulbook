"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { savePendingLink } from "@/lib/pendingLink";
import { parseShared } from "@/lib/shareText";
import { BrandMark, Icon } from "./Icon";

type PhoneRow = { t: string; chip: string; tone: string; img: string };

function hostOf(value: string): string | null {
  const v = parseShared(value).url ?? value.trim();
  if (!/^https?:\/\/\S+\.\S+/i.test(v)) return null;
  try {
    return new URL(v).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * The page's closing section and footer in one: paste a product link, watch it land in the
 * phone's "Needs you" list, then sign up. The link is kept and opens in Add product after sign-up.
 */
export function FooterTry({ rows }: { rows: PhoneRow[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const host = hostOf(value);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (v && !host) {
      setError("Paste the full product link, starting with https://");
      return;
    }
    if (v) {
      const shared = parseShared(v);
      savePendingLink(shared.url ?? v, shared.title);
    }
    router.push("/auth/signup");
  }

  return (
    <footer className="foot grad" id="final-cta" aria-labelledby="foot-title">
      <div className="foot-inner">
        <div className="foot-copy">
          <h2 className="l-h2" id="foot-title">Stop losing refunds to forgotten return windows.</h2>
          <p>Paste a product you&apos;re reviewing right now. It&apos;s waiting in your list the moment you sign up.</p>

          <form className="try" onSubmit={submit} noValidate>
            <label htmlFor="try-link" className="sr-only">Product link</label>
            <div className={`try-field ${error ? "is-error" : ""}`}>
              <Icon name="link" size={16} />
              <input
                id="try-link"
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder="Paste a product link"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(""); }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "try-error" : "try-hint"}
              />
              <button type="submit" className="btn btn-primary">{host ? "Track it" : "Start tracking"}</button>
            </div>
            {error ? (
              <p className="try-msg is-error" id="try-error" role="alert">{error}</p>
            ) : (
              <p className="try-msg" id="try-hint">
                {host ? <>Found <b>{host}</b>. Sign up and it&apos;s added with its return countdown.</> : <>Already have an account? <Link href="/auth/signin">Sign in</Link></>}
              </p>
            )}
          </form>
        </div>

        <div className="foot-phone-wrap" aria-hidden="true">
          <div className="foot-phone">
            <div className="foot-screen">
              <span className="foot-screen-head"><b>Needs you</b><em>{rows.length + (host ? 1 : 0)}</em></span>
              {host && (
                <div className="foot-row is-new" key={host}>
                  <span className="foot-new-icon"><Icon name="link" size={14} /></span>
                  <span className="foot-row-text"><b>Your product</b><span>{host}</span></span>
                  <span className="deadline-chip is-accent">New</span>
                </div>
              )}
              {rows.map((r) => (
                <div key={r.t} className="foot-row">
                  <span className="foot-thumb"><Image src={r.img} alt="" fill sizes="34px" loading="eager" /></span>
                  <span className="foot-row-text"><b>{r.t}</b></span>
                  <span className={`deadline-chip ${r.tone}`}>{r.chip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="foot-bar">
          <Link href="/" className="brand"><BrandMark /> Haulbook</Link>
          <nav className="foot-links" aria-label="Footer">
            <a href="#why">How it works</a>
            <a href="#faq">Questions</a>
            <Link href="/auth/signin">Sign in</Link>
            <Link href="/credits">Credits</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

/**
 * Phone-only bar. It appears once the hero buttons scroll away, hides again over the footer,
 * and takes people to the paste-a-link box rather than repeating the sign-up button.
 */
export function StickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-cta");
    const final = document.getElementById("final-cta");
    if (!hero || !final || !("IntersectionObserver" in window)) return;
    const seen = { hero: true, final: false };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) seen.hero = e.isIntersecting || e.boundingClientRect.top > 0;
        if (e.target === final) seen.final = e.isIntersecting;
      }
      setShow(!seen.hero && !seen.final);
    });
    io.observe(hero);
    io.observe(final);
    return () => io.disconnect();
  }, []);

  function goToTry() {
    const input = document.getElementById("try-link");
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus({ preventScroll: true });
  }

  return (
    <div className={`l-sticky ${show ? "is-shown" : ""}`} aria-hidden={!show}>
      <span>Have a product link handy?</span>
      <button type="button" className="btn btn-primary btn-sm" onClick={goToTry} tabIndex={show ? 0 : -1}>Try it</button>
    </div>
  );
}
