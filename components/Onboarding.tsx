"use client";

import Link from "next/link";
import { Icon } from "./Icon";
import { useProducts } from "./ProductsProvider";

/** First-run checklist on Home. Disappears once dismissed. */
export function Onboarding() {
  const { products, shops, settings, openAdd, addSamples, finishOnboarding } = useProducts();
  if (!settings || settings.onboarded) return null;

  const own = products.filter((p) => !p.isSample);
  const hasSamples = products.some((p) => p.isSample);
  const steps = [
    {
      done: own.length > 0,
      title: "Add your first product",
      text: "Paste a product link and the details fill in.",
      action: <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>Add product</button>,
    },
    {
      done: shops.length > 0,
      title: "Set your shops' return windows",
      text: "New products from a shop then get the right window on their own.",
      action: <Link href="/shops" className="btn btn-secondary btn-sm">Open shops</Link>,
    },
    {
      done: settings.remindersEnabled,
      title: settings.remindersEnabled
        ? `Reminders are on, ${settings.reminderDaysBefore} day${settings.reminderDaysBefore === 1 ? "" : "s"} before`
        : "Turn on email reminders",
      text: settings.remindersEnabled ? `We'll email ${settings.email} when something is due.` : "One short email on days something needs you.",
      action: <Link href="/settings" className="btn btn-quiet btn-sm">{settings.remindersEnabled ? "Change" : "Turn on"}</Link>,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="onboarding" aria-label="Getting started">
      <div className="onboarding-head">
        <div>
          <h2>Welcome to Haulbook</h2>
          <p className="muted">{doneCount} of 3 done. Three quick things and you&apos;re set.</p>
        </div>
        <button type="button" className="btn btn-quiet btn-sm" onClick={finishOnboarding}>
          {doneCount === 3 ? "Done" : "Hide"}
        </button>
      </div>
      <ol className="onboarding-steps">
        {steps.map((s) => (
          <li key={s.title} className={s.done ? "is-done" : ""}>
            <span className="onboarding-check" aria-hidden="true">{s.done ? <Icon name="check" size={13} /> : null}</span>
            <div className="onboarding-text">
              <b>{s.title}</b>
              <span>{s.text}</span>
            </div>
            {!s.done || s.title.startsWith("Reminders") ? s.action : null}
          </li>
        ))}
      </ol>
      {own.length === 0 && !hasSamples && (
        <p className="onboarding-foot">
          Just looking around?{" "}
          <button type="button" className="link-btn" onClick={addSamples}>Try it with 5 sample products</button>
        </p>
      )}
    </section>
  );
}

/** Shown while sample products are present. */
export function SampleBanner() {
  const { products, removeSamples } = useProducts();
  if (!products.some((p) => p.isSample)) return null;
  return (
    <div className="sample-banner" role="status">
      <span>You&apos;re exploring with sample products.</span>
      <button type="button" className="btn btn-secondary btn-sm" onClick={removeSamples}>Remove samples</button>
    </div>
  );
}
