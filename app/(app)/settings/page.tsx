"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Icon } from "@/components/Icon";
import { useProducts } from "@/components/ProductsProvider";
import { PushSettings } from "@/components/PushSettings";

interface Settings {
  remindersEnabled: boolean;
  reminderDaysBefore: number;
  email: string | null;
}

const DAY_OPTIONS = [1, 2, 3, 5, 7];

export default function SettingsPage() {
  const { showToast } = useProducts();
  const { data: session } = useSession();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [testState, setTestState] = useState<{ busy: boolean; message?: string; devOutbox?: boolean }>({ busy: false });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  async function save(patch: Partial<Settings>) {
    const previous = settings;
    setSettings((s) => (s ? { ...s, ...patch } : s));
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);
    if (!res?.ok) {
      setSettings(previous);
      showToast("Couldn't save. Try again.");
      return;
    }
    setSettings(await res.json());
    showToast("Saved");
  }

  async function sendTest() {
    setTestState({ busy: true });
    const res = await fetch("/api/reminders/test", { method: "POST" }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (!res?.ok) {
      setTestState({ busy: false, message: data?.error ?? "Couldn't send the email." });
      return;
    }
    setTestState({
      busy: false,
      devOutbox: !data.delivered,
      message: data.delivered
        ? `Sent to ${settings?.email}. It lists ${data.items} item${data.items === 1 ? "" : "s"}.`
        : `Email sending isn't set up on this server yet, so the email went to the local outbox.`,
    });
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="page-sub">Reminders and your account.</p>
        </div>
      </div>

      {!settings ? (
        <div className="skeleton" style={{ height: 220 }} aria-busy="true" />
      ) : (
        <div className="settings">
          <section className="panel-card">
            <div className="panel-card-head">
              <div>
                <h2>Email reminders</h2>
                <p className="muted">One short email on days something needs you: returns closing, posts due, refunds or payments late.</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.remindersEnabled}
                  onChange={(e) => save({ remindersEnabled: e.target.checked })}
                />
                <span aria-hidden="true" />
                <span className="sr-only">Email reminders</span>
              </label>
            </div>

            <div className={`field ${settings.remindersEnabled ? "" : "is-disabled"}`}>
              <span className="label" id="days-label">Remind me before a deadline</span>
              <div className="seg seg-fill" role="group" aria-labelledby="days-label">
                {DAY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={settings.reminderDaysBefore === d}
                    disabled={!settings.remindersEnabled}
                    onClick={() => save({ reminderDaysBefore: d })}
                  >
                    {d} day{d === 1 ? "" : "s"}
                  </button>
                ))}
              </div>
              <span className="hint">
                Emails go to {settings.email}. Late refunds and payments are repeated once a week, not every day.
              </span>
            </div>

            <div className="panel-card-foot">
              <button type="button" className="btn btn-secondary btn-sm" onClick={sendTest} disabled={testState.busy}>
                <Icon name="send" size={14} /> {testState.busy ? "Sending…" : "Send me a test email"}
              </button>
              {testState.message && (
                <span className="hint" role="status">
                  {testState.message}{" "}
                  {testState.devOutbox && (
                    <a href="/api/dev/outbox" target="_blank" rel="noreferrer">Open outbox</a>
                  )}
                </span>
              )}
            </div>
          </section>

          <PushSettings />

          <section className="panel-card">
            <div className="panel-card-head">
              <div>
                <h2>Your data</h2>
                <p className="muted">Download every product with its dates, links and amounts. Opens in Excel, Numbers or Google Sheets.</p>
              </div>
            </div>
            <div>
              <a href="/api/export" className="btn btn-secondary btn-sm" download>
                <Icon name="download" size={14} /> Download all products (CSV)
              </a>
            </div>
          </section>

          <section className="panel-card">
            <div className="panel-card-head">
              <div>
                <h2>Account</h2>
                <p className="muted">
                  Signed in as {session?.user?.name ? <><b>{session.user.name}</b> · </> : null}{session?.user?.email ?? settings.email}
                </p>
              </div>
            </div>
            <div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => signOut({ callbackUrl: "/" })}>
                <Icon name="logout" size={14} /> Sign out
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
