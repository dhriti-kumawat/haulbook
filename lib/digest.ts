import type { Deadline, ProductView } from "./products";
import { appUrl, emailLayout, esc, type Email } from "./mailer";
import { formatDate, formatMoney } from "./format";

interface DigestLine {
  product: ProductView;
  deadline: Deadline;
}

/**
 * Picks what to remind a creator about today.
 * Upcoming return and posting deadlines within `daysBefore` days, plus late refunds and payments.
 * Sends only when something new is worth an email: a deadline exactly `daysBefore` days away, tomorrow or today,
 * something that just became late, or — once a week — anything still late. This keeps the email from becoming daily noise.
 */
export function buildDigest(products: ProductView[], daysBefore: number, now = new Date()) {
  const lines: DigestLine[] = [];
  for (const product of products) {
    for (const d of product.deadlines) {
      const upcoming = (d.kind === "return" || d.kind === "post") && d.days >= 0 && d.days <= daysBefore;
      const late = d.days < 0 && d.kind !== "return";
      if (upcoming || late) lines.push({ product, deadline: d });
    }
  }
  lines.sort((a, b) => a.deadline.days - b.deadline.days);

  const isMonday = now.getDay() === 1;
  const trigger = lines.some(
    ({ deadline: d }) =>
      (d.days >= 0 && (d.days === daysBefore || d.days <= 1)) || d.days === -1 || (d.days < 0 && isMonday)
  );
  return { lines, shouldSend: trigger };
}

function lineText({ product, deadline: d }: DigestLine) {
  const when = d.days >= 0 ? `by ${formatDate(d.date)}` : "";
  const money =
    d.kind === "refund" && product.price ? ` (${formatMoney(product.price)})` : d.kind === "payment" && product.fee ? ` (${formatMoney(product.fee)})` : "";
  return { title: product.title, label: `${d.label}${money}`, when, shop: product.shop };
}

export function renderDigest(name: string | null, lines: DigestLine[]): Omit<Email, "to"> {
  const dueSoon = lines.filter((l) => l.deadline.days >= 0 && l.deadline.days <= 1).length;
  const late = lines.filter((l) => l.deadline.days < 0).length;
  const later = lines.length - dueSoon - late;
  const subject =
    lines.length === 1
      ? `${lines[0].deadline.label}: ${lines[0].product.title}`
      : [dueSoon && `${dueSoon} due by tomorrow`, late && `${late} late`, later && `${later} coming up`].filter(Boolean).join(" · ");

  const rows = lines
    .map((l) => {
      const t = lineText(l);
      const color = l.deadline.days < 0 ? "#963f55" : l.deadline.days <= 1 ? "#b4526a" : "#a0742e";
      return `<tr><td style="padding:12px 0;border-top:1px solid #e8e3f3">
<div style="font-weight:600">${esc(t.title)}</div>
<div style="font-size:13px;color:#6d6787">${t.shop ? esc(t.shop) + " · " : ""}<span style="color:${color};font-weight:600">${esc(t.label)}</span> ${esc(t.when)}</div>
</td></tr>`;
    })
    .join("");

  const html = emailLayout(
    `Hi${name ? ` ${name.split(" ")[0]}` : ""}, here's what needs you`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
<p style="margin:22px 0 0"><a href="${appUrl("/home")}" style="display:inline-block;background:#231d3b;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:999px">Open Haulbook</a></p>`
  );
  const text = [
    `Here's what needs you:`,
    ...lines.map((l) => {
      const t = lineText(l);
      return `- ${t.title}${t.shop ? ` (${t.shop})` : ""}: ${t.label} ${t.when}`.trim();
    }),
    "",
    `Open Haulbook: ${appUrl("/home")}`,
    `Change email settings: ${appUrl("/settings")}`,
  ].join("\n");
  return { subject, html, text };
}

/** The same digest, short enough for a phone notification. */
export function renderPushDigest(lines: DigestLine[]): { title: string; body: string } {
  const late = lines.filter((l) => l.deadline.days < 0).length;
  const dueSoon = lines.length - late;
  const title =
    dueSoon && late
      ? `${dueSoon} due soon · ${late} late`
      : dueSoon
        ? `${dueSoon} thing${dueSoon === 1 ? "" : "s"} need${dueSoon === 1 ? "s" : ""} you soon`
        : `${late} payment${late === 1 ? "" : "s"} or refund${late === 1 ? "" : "s"} late`;
  const shown = lines.slice(0, 3).map(({ product, deadline: d }) => `${product.title.length > 40 ? `${product.title.slice(0, 39)}…` : product.title}: ${d.label.toLowerCase()}`);
  const more = lines.length > 3 ? ` +${lines.length - 3} more` : "";
  return { title, body: shown.join("\n") + more };
}
