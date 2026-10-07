/**
 * Shop apps share a product as text, e.g.
 *   "Check out this product on Amazon: boAt Rockerz 550 Bluetooth Headphones https://amzn.in/d/abc123"
 * Shops often block us from reading the page, but the share text already carries the name.
 * Pulls the link and the product name out of such text.
 */
const FILLER = [
  /check (?:out )?this (?:product|item|out)?(?: on [\w.]+)?[:!-]?/gi,
  /(?:i )?found (?:this|it) on [\w.]+[:!-]?/gi,
  /(?:look|see) what i found(?: on [\w.]+)?[:!-]?/gi,
  /shop (?:now )?on [\w.]+[:!-]?/gi,
  /(?:hey|hi)[,!]?\s/gi,
  /\s*:\s*amazon\.in\b.*$/i, // "…: Amazon.in: Electronics"
];

export function parseShared(input: string | null | undefined): { url: string | null; title: string | null } {
  const text = (input ?? "").trim();
  const url = text.match(/https?:\/\/[^\s<>"']+/i)?.[0]?.replace(/[).,!?]+$/, "") ?? null;
  let title = url ? text.replace(url, " ") : text;
  for (const f of FILLER) title = title.replace(f, " ");
  title = title.replace(/\s+/g, " ").replace(/^[\s:–—-]+|[\s:–—-]+$/g, "").trim();
  return { url, title: title.length >= 4 && /[a-z]/i.test(title) ? title.slice(0, 120) : null };
}
