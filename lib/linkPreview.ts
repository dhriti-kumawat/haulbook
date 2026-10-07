import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";
import zlib from "node:zlib";

/**
 * Reads a product page and pulls out its name, photo, price and shop.
 * Uses the page's Open Graph tags, JSON-LD product data and <title>, in that order.
 *
 * The URL comes from the user, so the fetch is locked down against server-side request forgery:
 * only http(s) on ports 80/443, only public IP addresses (checked again on every redirect),
 * a short timeout and a size cap. The connection is pinned to the address that passed the check,
 * so the site cannot switch to a private address between the check and the request.
 */

export interface LinkPreview {
  url: string;
  title: string | null;
  imageUrl: string | null;
  price: number | null;
  shop: string | null;
}

const TIMEOUT_MS = 8000;
const MAX_BYTES = 3_000_000;
const MAX_REDIRECTS = 4;

const SHOPS: [RegExp, string][] = [
  [/(^|\.)amazon\.(in|com|co\.uk|de|ae)$|(^|\.)amzn\.(to|in|eu)$/, "Amazon"],
  [/(^|\.)flipkart\.com$|(^|\.)fkrt\.it$|(^|\.)dl\.flipkart\.com$/, "Flipkart"],
  [/(^|\.)myntra\.com$/, "Myntra"],
  [/(^|\.)meesho\.com$/, "Meesho"],
  [/(^|\.)ajio\.com$/, "Ajio"],
  [/(^|\.)nykaa(fashion)?\.com$/, "Nykaa"],
  [/(^|\.)decathlon\.(in|com)$/, "Decathlon"],
  [/(^|\.)tatacliq\.com$/, "Tata CLiQ"],
  [/(^|\.)croma\.com$/, "Croma"],
  [/(^|\.)zara\.com$/, "Zara"],
  [/(^|\.)hm\.com$/, "H&M"],
  [/(^|\.)ikea\.com$/, "IKEA"],
];

export function shopFromHost(host: string): string {
  const h = host.toLowerCase().replace(/^www\./, "");
  const known = SHOPS.find(([re]) => re.test(h));
  if (known) return known[1];
  const parts = h.split(".");
  const name = parts.length > 2 && parts.at(-2)!.length <= 3 ? parts.at(-3)! : parts.at(-2) ?? h;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6 === "::1" || v6 === "::") return true;
  if (v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80")) return true;
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? isPrivateAddress(mapped[1]) : false;
}

async function assertPublicUrl(raw: string): Promise<{ url: URL; address: string; family: number }> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new PreviewError("That doesn't look like a link.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new PreviewError("Only http and https links are supported.");
  if (url.username || url.password) throw new PreviewError("Links with a username or password are not supported.");
  if (url.port && url.port !== "80" && url.port !== "443") throw new PreviewError("That link uses an unusual port.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new PreviewError("That link points to a private address.");
  }
  const addresses = isIP(host)
    ? [{ address: host, family: isIP(host) }]
    : await lookup(host, { all: true }).catch(() => [] as { address: string; family: number }[]);
  if (addresses.length === 0) throw new PreviewError("Couldn't find that website.");
  if (addresses.some((a) => isPrivateAddress(a.address))) throw new PreviewError("That link points to a private address.");
  return { url, address: addresses[0].address, family: addresses[0].family };
}

export class PreviewError extends Error {}

interface RawResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
}

/** One GET request, connected to `address` only, with a timeout and size cap. */
function requestPinned(url: URL, address: string, family: number): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const mod = url.protocol === "https:" ? https : http;
    const req = mod.request(
      url,
      {
        method: "GET",
        timeout: TIMEOUT_MS,
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-IN,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
        },
        // Use the address that was checked; TLS still verifies the certificate for the real host name.
        lookup: ((_host: string, opts: { all?: boolean }, cb: (...args: unknown[]) => void) =>
          opts?.all ? cb(null, [{ address, family }]) : cb(null, address, family)) as never,
      },
      (res) => {
        const encoding = String(res.headers["content-encoding"] ?? "").toLowerCase();
        const stream =
          encoding === "gzip" ? res.pipe(zlib.createGunzip()) :
          encoding === "deflate" ? res.pipe(zlib.createInflate()) :
          encoding === "br" ? res.pipe(zlib.createBrotliDecompress()) : res;
        const chunks: Buffer[] = [];
        let size = 0;
        stream.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_BYTES) {
            // Enough to find the product tags; stop reading.
            stream.destroy();
            req.destroy();
            resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) });
            return;
          }
          chunks.push(chunk);
        });
        stream.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }));
        stream.on("error", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }));
      }
    );
    req.on("timeout", () => req.destroy(new PreviewError("The shop took too long to answer.")));
    req.on("error", (e) =>
      reject(e instanceof PreviewError ? e : new PreviewError("Couldn't reach the shop. It may block automatic requests."))
    );
    req.end();
  });
}

async function fetchHtml(start: string): Promise<{ html: string; finalUrl: URL }> {
  let target = await assertPublicUrl(start);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await requestPinned(target.url, target.address, target.family);
    const location = res.headers.location;
    if (res.status >= 300 && res.status < 400 && location) {
      target = await assertPublicUrl(new URL(location, target.url).toString());
      continue;
    }
    if (res.status < 200 || res.status >= 300) {
      throw new PreviewError(res.status === 403 || res.status === 503 ? "The shop blocked the request." : `The shop answered with an error (${res.status}).`);
    }
    if (!String(res.headers["content-type"] ?? "").includes("html")) throw new PreviewError("That link isn't a web page.");
    return { html: res.body.toString("utf8"), finalUrl: target.url };
  }
  throw new PreviewError("Too many redirects.");
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();

function meta(html: string, ...names: string[]): string | null {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name|itemprop)=["']${name}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name|itemprop)=["']${name}["']`,
      "i"
    );
    const m = html.match(re);
    if (m) return decode(m[1] ?? m[2]);
  }
  return null;
}

/** Finds a schema.org Product in the page's JSON-LD blocks. */
function jsonLdProduct(html: string): { name?: string; image?: string; price?: number } | null {
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const [, body] of blocks) {
    try {
      const data = JSON.parse(body.trim());
      const nodes: any[] = (Array.isArray(data) ? data : data["@graph"] ?? [data]).flat();
      const product = nodes.find((n) => n && (n["@type"] === "Product" || (Array.isArray(n["@type"]) && n["@type"].includes("Product"))));
      if (!product) continue;
      const image = Array.isArray(product.image) ? product.image[0] : typeof product.image === "object" ? product.image?.url : product.image;
      const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
      const price = Number(offer?.price ?? offer?.lowPrice);
      return { name: product.name, image, price: Number.isFinite(price) ? price : undefined };
    } catch {
      // Ignore broken JSON-LD and keep looking.
    }
  }
  return null;
}

function cleanTitle(title: string | null, shop: string) {
  if (!title) return null;
  let t = title
    // "Buy X Online at Best Price | Shop.com" style suffixes and prefixes.
    .replace(/^(buy|shop)\s+/i, "")
    .replace(/\s*(online)?\s*(at|from)\s+(best|low(est)?)\s+price.*$/i, "")
    .replace(/\s*[|:–-]\s*(amazon|flipkart|myntra|nykaa|ajio|meesho|croma|tata cliq|decathlon)[\w.\s]*$/i, "")
    .replace(new RegExp(`\\s*[|:–-]\\s*${shop}.*$`, "i"), "")
    .replace(/^amazon\.in\s*:\s*/i, "")
    .trim();
  // Shops often pack specs into the title ("Hair Dryer; 3 Heat Settings; …"). Keep the part before them.
  if (t.length > 60) {
    const cut = t.search(/\s*[;|]\s*|\s+[–—]\s+|\s+-\s+/);
    if (cut >= 15) t = t.slice(0, cut).trim();
  }
  if (t.length > 120) t = `${t.slice(0, 117).trimEnd()}…`;
  return t || null;
}

/** Titles shops show on bot checks, errors and sign-in walls, or just their own name. Never a product name. */
const JUNK_TITLE = /robot check|captcha|access denied|page not found|\b404\b|sign[ -]?in|log[ -]?in|just a moment|attention required|are you a human|something went wrong|^error\b|not available|online shopping|shop online|online fashion|full range of|^products?\b|^home\b|&nbsp;/i;

function isJunkTitle(title: string | null, shop: string, host: string) {
  if (!title) return true;
  const t = title.trim().toLowerCase();
  const bare = host.replace(/^www\./, "").toLowerCase();
  return (
    t.length < 4 ||
    t === shop.toLowerCase() ||
    t === bare ||
    t === bare.split(".")[0] ||
    JUNK_TITLE.test(t) ||
    // A single "word" (a code, an id, a file name) is never a product name.
    !/\s/.test(t) ||
    // Mostly digits and codes, e.g. "469583766001 p".
    (t.replace(/[^a-z]/g, "").length < 4)
  );
}

/** Many shop links carry the product name in the path ("/Apple-iPhone-15-128GB/dp/…"). */
function titleFromPath(url: URL): string | null {
  const parts = url.pathname
    .split("/")
    .map((p) => {
      try {
        return decodeURIComponent(p);
      } catch {
        return p;
      }
    })
    .filter((p) => /[a-z]/i.test(p) && (p.match(/[-_]/g)?.length ?? 0) >= 2 && !/^(ref=|dp$|gp$|product$)/i.test(p));
  const best = parts.sort((a, b) => b.length - a.length)[0];
  if (!best) return null;
  // Drop ids and codes ("300989000", "p04437400") so only the words of the name remain.
  const words = best
    .replace(/\.(html?|php|aspx?)$/i, "")
    .split(/[-_\s]+/)
    .filter((w) => w && !/^\d{4,}$/.test(w) && !/^[a-z]{0,2}\d{5,}$/i.test(w));
  if (words.filter((w) => /[a-z]{2,}/i.test(w)).length < 2) return null;
  const t = words.join(" ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function absolute(src: string | null | undefined, base: URL) {
  if (!src) return null;
  try {
    const u = new URL(src, base);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

interface Extracted {
  title: string | null;
  imageUrl: string | null;
  price: number | null;
}

/** Pulls the product name, photo and price out of a page's HTML. */
function extract(html: string, pageUrl: URL, shop: string): Extracted {
  const ld = jsonLdProduct(html);
  const rawTitle =
    ld?.name ?? meta(html, "og:title", "twitter:title") ?? (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ? decode(html.match(/<title[^>]*>([^<]+)<\/title>/i)![1]) : null);
  const image =
    ld?.image ??
    meta(html, "og:image:secure_url", "og:image", "twitter:image", "image") ??
    // Amazon keeps its main photo in its own image data rather than in meta tags.
    html.match(/"hiRes":"(https:[^"]+)"/)?.[1] ??
    html.match(/data-old-hires=["'](https:[^"']+)["']/i)?.[1] ??
    html.match(/data-a-dynamic-image=["']\{&quot;(https:[^&]+)&quot;/i)?.[1] ??
    // Other common places shops put the main photo.
    html.match(/itemprop=["']image["'][^>]*(?:content|src)=["']([^"']+)["']/i)?.[1] ??
    html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)?.[1];
  const priceText =
    meta(html, "product:price:amount", "og:price:amount", "price") ??
    // Amazon's visible price.
    html.match(/class=["']a-price-whole["'][^>]*>([\d,]+)/)?.[1] ??
    // Microdata and the product data many shops embed for their own scripts.
    html.match(/itemprop=["']price["'][^>]*content=["']([\d.,]+)["']/i)?.[1] ??
    html.match(/"(?:sellingPrice|offerPrice|salePrice|finalPrice|price)"\s*:\s*"?(\d[\d,]*(?:\.\d+)?)/)?.[1] ??
    null;
  const price = ld?.price ?? (priceText ? Number(priceText.replace(/[^\d.]/g, "")) || null : null);
  const title = cleanTitle(rawTitle, shop);
  // A bot check or error page still has a title ("Amazon.in", "Access Denied"); it's not a product name.
  return {
    title: isJunkTitle(title, shop, pageUrl.hostname) ? null : title,
    imageUrl: absolute(image, pageUrl),
    price: price && price > 0 ? Math.round(price * 100) / 100 : null,
  };
}

/**
 * Fallback reader for shops that block us or build their pages with JavaScript. Uses Jina Reader
 * (open source, github.com/jina-ai/reader), which loads the page in a real browser and returns its HTML.
 * Set READER_URL to a self-hosted copy, READER_API_KEY for higher limits, or READER_URL=off to disable.
 * Only public links that already passed assertPublicUrl are sent.
 */
const READER_URL = process.env.READER_URL ?? "https://r.jina.ai/";

async function readViaReader(url: URL): Promise<string | null> {
  if (READER_URL === "off") return null;
  const res = await fetch(`${READER_URL}${url.toString()}`, {
    headers: {
      "X-Return-Format": "html",
      ...(process.env.READER_API_KEY ? { Authorization: `Bearer ${process.env.READER_API_KEY}` } : {}),
    },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) return null;
  const html = await res.text();
  return html.length > 4_000_000 ? html.slice(0, 4_000_000) : html;
}

/**
 * Second fallback: Microlink (open source core: github.com/microlinkhq/metascraper). Its free tier
 * allows about 50 links a day; set MICROLINK_API_KEY for more, or MICROLINK=off to disable.
 */
async function readViaMicrolink(url: URL): Promise<Extracted | null> {
  if (process.env.MICROLINK === "off") return null;
  const key = process.env.MICROLINK_API_KEY;
  const res = await fetch(`https://${key ? "pro" : "api"}.microlink.io/?url=${encodeURIComponent(url.toString())}`, {
    headers: key ? { "x-api-key": key } : {},
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return null;
  const body = (await res.json().catch(() => null)) as { status?: string; data?: { title?: string; image?: { url?: string } } } | null;
  if (body?.status !== "success" || !body.data) return null;
  const shop = shopFromHost(url.hostname);
  const title = cleanTitle(body.data.title ?? null, shop);
  return { title: isJunkTitle(title, shop, url.hostname) ? null : title, imageUrl: absolute(body.data.image?.url, url), price: null };
}

const complete = (x: Extracted | null) => Boolean(x?.title && (x.imageUrl || x.price));
const merge = (a: Extracted | null, b: Extracted | null): Extracted | null =>
  !b ? a : { title: a?.title ?? b.title, imageUrl: a?.imageUrl ?? b.imageUrl, price: a?.price ?? b.price };

export async function previewLink(raw: string): Promise<LinkPreview> {
  const start = await assertPublicUrl(raw.trim());
  let finalUrl = start.url;
  let found: Extracted | null = null;
  let blocked: PreviewError | null = null;

  try {
    const page = await fetchHtml(raw.trim());
    finalUrl = page.finalUrl;
    found = extract(page.html, finalUrl, shopFromHost(finalUrl.hostname));
  } catch (e) {
    if (!(e instanceof PreviewError)) throw e;
    blocked = e;
  }
  const shop = shopFromHost(finalUrl.hostname);

  // Blocked, or only part of the details: ask the reader, and keep whatever each source found.
  if (!complete(found)) {
    const html = await readViaReader(finalUrl).catch(() => null);
    if (html) found = merge(found, extract(html, finalUrl, shop));
  }
  if (!found?.title || !found.imageUrl) found = merge(found, await readViaMicrolink(finalUrl).catch(() => null));

  const title = found?.title ?? titleFromPath(finalUrl) ?? titleFromPath(start.url);
  if (!title && !found?.imageUrl && !found?.price) {
    throw blocked && !/blocked/i.test(blocked.message) ? blocked : new PreviewError(`${shop} didn't let us read this page.`);
  }
  return { url: finalUrl.toString(), title, imageUrl: found?.imageUrl ?? null, price: found?.price ?? null, shop };
}
