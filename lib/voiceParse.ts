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

/**
 * Fallback when no AI key is set: catches the common patterns
 * ("from Amazon", "for 1999", "return in 7 days", "PR", "collab").
 */
export function parseSimple(transcript: string): VoiceProduct {
  const t = transcript.trim();
  const lower = t.toLowerCase();
  const num = (s: string) => {
    const m = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*(k|thousand|hazaar)?/i);
    return m ? Math.round(Number(m[1]) * (m[2] ? 1000 : 1)) : null;
  };
  const amountMatch = lower.match(/(?:for|at|rs\.?|₹|rupees?|fee(?: of)?|paid)\s*([\d.,]+\s*(?:k|thousand|hazaar)?)/i);
  const returnMatch = lower.match(/return(?:\s+window)?\s+(?:in|within|of)?\s*(\d+)\s*days?/);
  const shopMatch = t.match(/\b(?:from|on)\s+([A-Z][\w&.]*(?:\s+[A-Z][\w&.]*)?)/);
  const type = /\bcollab|paid partnership|paying me\b/.test(lower) ? "collab" : /\bpr\b|sent (?:me )?free|gifted|gift/.test(lower) ? "pr" : /\bbought|ordered|purchased|got\b/.test(lower) ? "bought" : null;
  // "Lakme sent me a PR kit…": the brand comes before "sent".
  const sender = t.match(/^([A-Z][\w&.]*(?:\s+[A-Z][\w&.]*)?)\s+(?:sent|gifted|gave)\b/);
  const title = (sender ? `${sender[1]} ${t.match(/\b(PR kit|PR package|hamper|kit|box)\b/i)?.[1] ?? "PR"}` : t)
    .replace(/^(i\s+)?(just\s+)?(got|bought|ordered|received)\s+(the\s+|a\s+|an\s+)?/i, "")
    .split(/\s*[,.;]\s*|\s+(?:from|on|for|at|return|which|and|need|needs|fee|it|arrived|delivered)\s+/i)[0]
    .replace(/\s+(collab|pr)$/i, (m) => (/collab/i.test(m) ? " collab" : " PR"))
    .trim();
  return {
    title: title.length >= 4 && /\s/.test(title) ? title.charAt(0).toUpperCase() + title.slice(1) : null,
    type,
    shop: shopMatch ? shopMatch[1] : sender ? sender[1] : null,
    amount: amountMatch ? num(amountMatch[1]) : null,
    delivered: /\barrived|delivered|received|got it\b/.test(lower) ? true : null,
    deliveredOn: null,
    returnWindowDays: returnMatch ? Number(returnMatch[1]) : null,
    postBy: null,
    deliverables: lower.match(/\b(\d+\s+(?:reels?|stories|story|posts?|videos?|shorts?)(?:\s*(?:and|\+|&)\s*\d+\s+(?:reels?|stories|story|posts?|videos?|shorts?))*)/)?.[1].replace(/\s+and\s+/g, " + ") ?? null,
  };
}
