import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

/** What the Add product form can be filled with from a spoken description. Null = not mentioned. */
export const VoiceProductSchema = z.object({
  title: z.string().nullable().describe("Product name with brand, e.g. 'boAt Rockerz 550 headphones'"),
  type: z.enum(["bought", "pr", "collab"]).nullable().describe("bought = paid for it; pr = sent free by a brand; collab = brand is paying the creator"),
  shop: z.string().nullable().describe("Shop it was bought from (Amazon, Myntra…), or the brand for PR and collabs"),
  amount: z.number().nullable().describe("Rupees: price paid for bought/PR, or the fee for a paid collab"),
  delivered: z.boolean().nullable().describe("true if it has already arrived"),
  deliveredOn: z.string().nullable().describe("YYYY-MM-DD the product arrived"),
  returnWindowDays: z.number().int().nullable().describe("Days allowed to return a bought product"),
  postBy: z.string().nullable().describe("YYYY-MM-DD the post is due, for PR and collabs"),
  deliverables: z.string().nullable().describe("What must be posted, e.g. '1 Reel + 2 stories'"),
});
export type VoiceProduct = z.infer<typeof VoiceProductSchema>;

const SYSTEM = `You fill in a product-tracking form for an Indian content creator from what they said out loud.
The speech may mix English and Hindi (Hinglish) and may contain speech-recognition mistakes; fix obvious ones (e.g. "boat" means the brand boAt).
Only fill a field when the creator said it or it is clearly implied; otherwise use null. Never invent prices, dates or brands.
Amounts are rupees ("1.5k" = 1500, "2 thousand" = 2000). Resolve relative dates ("Friday", "next week", "kal") against today's date given in the message.
If they say a brand sent it free or as PR, type is "pr"; if a brand is paying them, "collab"; if they bought or ordered it, "bought".`;

let client: Anthropic | null = null;

export function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Turns a spoken product description into form fields with Claude. */
export async function parseWithClaude(transcript: string, today: string): Promise<VoiceProduct> {
  client ??= new Anthropic();
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    // If the model declines (a false-positive safety refusal), the API retries on a suitable model itself.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    // Short extraction: low effort keeps it fast and cheap.
    output_config: { effort: "low", format: betaZodOutputFormat(VoiceProductSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: `Today is ${today}.\nWhat the creator said:\n"""${transcript}"""` }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error("Couldn't understand that.");
  return response.parsed_output;
}

/** Shops creators buy from, matched in any letter case (speech-to-text writes everything in lowercase). */
const SHOPS = [
  "Amazon", "Flipkart", "Myntra", "Meesho", "Ajio", "Nykaa Fashion", "Nykaa", "Decathlon", "Tata Cliq", "Purplle", "Snapdeal",
  "JioMart", "Blinkit", "Zepto", "Swiggy Instamart", "Instamart", "BigBasket", "FirstCry", "Lenskart", "Croma", "Reliance Digital",
  "Pepperfry", "Urbanic", "H&M", "Zara", "Uniqlo", "Tira", "Sephora", "Westside", "Lifestyle", "Shoppers Stop",
];

const SMALL: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30,
  forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, a: 1, an: 1,
};
const SCALE: Record<string, number> = { hundred: 100, thousand: 1000, k: 1000, hazaar: 1000, hazar: 1000, lakh: 100000, lakhs: 100000 };

/** "two thousand five hundred" → "2500", "fifteen hundred" → "1500", "1.5k" → "1500", "24,900" → "24900". */
function normaliseNumbers(text: string) {
  let t = text.replace(/(\d),(?=\d{2,3}\b)/g, "$1");
  t = t.replace(/\b(\d+(?:\.\d+)?)\s*(k|thousand|hazaar|hazar|lakhs?)\b/gi, (_, n, unit) => String(Math.round(Number(n) * SCALE[unit.toLowerCase()])));
  const words = Object.keys(SMALL).filter((w) => w !== "a" && w !== "an").concat(Object.keys(SCALE).filter((w) => w !== "k"));
  const run = new RegExp(`\\b(?:(?:${words.join("|")}|a|an|and)\\s+)*(?:${words.join("|")})\\b`, "gi");
  return t.replace(run, (phrase) => {
    const parts = phrase.toLowerCase().split(/\s+/).filter((w) => w !== "and");
    if (parts.every((w) => w === "a" || w === "an")) return phrase;
    let total = 0, current = 0, used = false;
    for (const w of parts) {
      if (w in SMALL) { current += SMALL[w]; used = true; }
      else if (w in SCALE) { current = (current || 1) * SCALE[w]; if (SCALE[w] >= 1000) { total += current; current = 0; } used = true; }
    }
    return used ? String(total + current) : phrase;
  });
}

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** A spoken date ("friday", "tomorrow", "in 5 days", "20th october", "20/10") as YYYY-MM-DD, counted from `today`. */
function spokenDate(phrase: string, today: string): string | null {
  const base = new Date(`${today}T00:00:00Z`);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const plus = (n: number) => { const d = new Date(base); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
  const p = phrase.toLowerCase();
  if (/\btoday|aaj\b/.test(p)) return plus(0);
  if (/\byesterday\b/.test(p)) return plus(-1);
  if (/\btomorrow\b/.test(p)) return plus(1);
  if (/\bnext week\b/.test(p)) return plus(7);
  const inDays = p.match(/\bin\s+(\d+)\s+days?\b/);
  if (inDays) return plus(Number(inDays[1]));
  const inWeeks = p.match(/\bin\s+(\d+)\s+weeks?\b/);
  if (inWeeks) return plus(7 * Number(inWeeks[1]));
  const day = DAYS.findIndex((d) => new RegExp(`\\b${d}\\b`).test(p));
  if (day >= 0) return plus(((day - base.getUTCDay() + 7) % 7) || 7);
  const mon = "(" + MONTHS.map((m) => m.slice(0, 3) + (m.length > 3 ? `(?:${m.slice(3)})?` : "")).join("|") + ")";
  const dm = p.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${mon}\\b`)) ?? null;
  const md = dm ? null : p.match(new RegExp(`\\b${mon}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`));
  const slash = p.match(/\b(\d{1,2})[/-](\d{1,2})\b/);
  const ordinal = p.match(/\b(\d{1,2})(?:st|nd|rd|th)\b/);
  let d: number | null = null, m: number | null = null;
  if (dm) { d = Number(dm[1]); m = MONTHS.findIndex((x) => x.startsWith(dm[2].slice(0, 3))); }
  else if (md) { d = Number(md[2]); m = MONTHS.findIndex((x) => x.startsWith(md[1].slice(0, 3))); }
  else if (slash) { d = Number(slash[1]); m = Number(slash[2]) - 1; }
  else if (ordinal) { d = Number(ordinal[1]); m = base.getUTCMonth(); if (d < base.getUTCDate()) m += 1; }
  if (d === null || m === null || d < 1 || d > 31 || m < 0) return null;
  let y = base.getUTCFullYear() + Math.floor(m / 12);
  m %= 12;
  // A date that has passed this year most likely means next year (e.g. "5th January" said in December).
  if (new Date(Date.UTC(y, m, d)) < new Date(base.getTime() - 60 * 86400_000)) y += 1;
  const out = new Date(Date.UTC(y, m, d));
  return out.getUTCMonth() === m ? iso(out) : null;
}

const titleCase = (s: string) =>
  s.replace(/\b([a-z])([a-z]*)/g, (w, a, b) => (/^(of|and|the|with|for|in|a|an)$/.test(w) ? w : a.toUpperCase() + b))
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\bBoat\b/g, "boAt")
    .replace(/\bPr\b/g, "PR");

/**
 * Fallback when no AI key is set. Works on what browsers' speech-to-text gives: all lowercase, numbers
 * as digits or words. Catches the shop ("from amazon"), price ("for 1999", "₹1,999", "two thousand
 * rupees"), return window ("return in 7 days", "10 day return"), type (PR, collab, bought), post date
 * ("post by friday", "due 20th october"), arrival ("arrived today") and deliverables ("1 reel and 2 stories").
 */
export function parseSimple(transcript: string, today = new Date().toISOString().slice(0, 10)): VoiceProduct {
  const t = normaliseNumbers(transcript.trim().replace(/\s+/g, " "));
  const lower = t.toLowerCase();

  let type: VoiceProduct["type"] = /\bcollab(?:oration)?\b|paid partnership|paying me|\bfee\b/.test(lower)
    ? "collab"
    : /\bpr\b|\bp r\b|sent (?:me )?(?:it |this |a |an )?(?:free|for free)|\bgifted|\bfree\b|sent me/.test(lower)
      ? "pr"
      : /\b(?:bought|ordered|purchased|got|buy)\b/.test(lower) ? "bought" : null;

  // Shop: a known shop anywhere, else the words after "from"/"on"/"with" (the brand, for PR and collabs).
  const known = SHOPS.find((s) => new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(t));
  const sender = lower.match(/^(?:so\s+)?([a-z][\w&.']*(?:\s+[a-z][\w&.']*)?)\s+(?:sent|gifted|gave)\b/);
  const fromWords = lower.match(/\b(?:from|on|with|by)\s+([a-z][\w&.']*(?:\s+(?!for\b|at\b|and\b|return|which|it\b|need|post|in\b|on\b|by\b|rs\b|rupees)[a-z][\w&.']*)?)/);
  const brandWord = (w?: string) => (w && !/^(the|a|an|my|me|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|amazon\.in)$/.test(w) ? titleCase(w) : null);
  // "mamaearth collab …": a one- or two-word brand right before "collab" or "pr".
  const before = lower.match(/^(?:a\s+|an\s+)?([a-z][\w&.']*(?:\s+[a-z][\w&.']*)?)\s+(?:collab|pr)\b/);
  const shop = known ?? (sender ? brandWord(sender[1]) : null) ?? (fromWords && !/^\d/.test(fromWords[1]) ? brandWord(fromWords[1]) : null) ?? (before ? brandWord(before[1]) : null);

  // Price: a number next to a money word, before or after it. Skips "for 1 reel", "in 7 days".
  const money = "(?:₹|rs\\.?|inr|rupees?|bucks)";
  const amountRe = new RegExp(
    `(?:${money}\\s*(\\d+(?:\\.\\d+)?))|(?:(\\d+(?:\\.\\d+)?)\\s*${money})|(?:\\b(?:for|at|price(?: is| was)?|cost(?:s|ed)?|paid|fee(?: of| is)?|worth|deal(?: of| for| is)?)\\s+(\\d+(?:\\.\\d+)?)\\b(?!\\s*(?:days?|weeks?|reels?|stories|story|posts?|videos?|shorts?|st\\b|nd\\b|rd\\b|th\\b|%)))`,
    "i"
  );
  const am = lower.match(amountRe);
  // Otherwise a lone price-sized number ("iris candle set 1500 from amazon").
  const bare = am ? null : lower.match(/(?:^|\s)(\d{2,7}(?:\.\d+)?)(?!\s*(?:days?|weeks?|reels?|stories|story|posts?|videos?|shorts?|st\b|nd\b|rd\b|th\b|%|\/|-))(?=\s|$)/);
  const amount = am ? Math.round(Number(am[1] ?? am[2] ?? am[3])) : bare && Number(bare[1]) >= 50 ? Math.round(Number(bare[1])) : null;
  // A shop and a price with no other clue means it was bought.
  if (!type && known && amount) type = "bought";

  const ret =
    lower.match(/\breturn(?:able)?(?:\s+window)?\s*(?:is|of|in|within|for|till|until)?\s*(\d+)\s*-?\s*days?/) ??
    lower.match(/\b(\d+)\s*-?\s*days?\s+(?:return|replacement|exchange)/);
  const returnWindowDays = ret ? Number(ret[1]) : null;

  // Dates: "post/due/live/deadline … <date>" is the post date; "arrived/delivered … <date>" the arrival.
  const postPhrase = lower.match(/\b(?:post(?:ed|ing)?|due|deadline|live|upload|publish|go live)\b(.{0,40})/);
  // For PR and collabs, a bare "by friday" / "before the 20th" is the post date too.
  const byPhrase = type === "pr" || type === "collab" ? lower.match(/\b(?:by|before|till|until)\b(.{0,25})/) : null;
  const postBy = (postPhrase ? spokenDate(postPhrase[1], today) : null) ?? (byPhrase ? spokenDate(byPhrase[1], today) : null);
  const arrived = /\b(?:arrived|delivered|received|came|got it)\b/.test(lower);
  const arrivedPhrase = lower.match(/\b(?:arrived|delivered|received|came)\b(.{0,30})/);
  const deliveredOn = arrivedPhrase ? spokenDate(arrivedPhrase[1], today) : null;

  const deliverables =
    lower.match(/\b(\d+\s+(?:reels?|stories|story|posts?|videos?|shorts?|youtube videos?)(?:\s*(?:and|\+|&|,)\s*\d+\s+(?:reels?|stories|story|posts?|videos?|shorts?))*)/)?.[1]
      .replace(/\s*(?:and|&|,)\s*/g, " + ") ?? null;

  // Name: what's left after the verb, up to the first detail.
  let name = sender
    ? `${sender[1]} ${lower.match(/\b(pr kit|pr package|pr box|hamper|kit|box|package)\b/)?.[1] ?? "PR"}`
    : t
        .replace(/^(?:so\s+|okay\s+|ok\s+)?(?:i\s+)?(?:just\s+|have\s+|had\s+)?(?:got|bought|ordered|purchased|received|picked up|added)\s+(?:the\s+|a\s+|an\s+|this\s+|my\s+)?/i, "")
        .split(/\s*[,.;]\s*|\s+(?:from|on|for|at|return|returnable|which|need|needs|have to|fee|it|arrived|delivered|worth|price|cost|costs|post|due|by|with|rs|rupees)\s+|\s+(?:\d|₹)/i)[0];
  name = name.replace(/\s+(?:collab|pr)$/i, "").trim();
  if (shop && name.toLowerCase() === shop.toLowerCase()) name = type === "collab" ? `${name} collab` : type === "pr" ? `${name} PR` : "";
  const title = name.length >= 3 ? titleCase(name) : null;

  return {
    title,
    type,
    shop,
    amount: amount && amount > 0 ? amount : null,
    delivered: arrived || deliveredOn ? true : null,
    deliveredOn,
    returnWindowDays,
    postBy,
    deliverables,
  };
}
