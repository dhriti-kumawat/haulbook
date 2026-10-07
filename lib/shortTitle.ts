/**
 * A shorter product name for long shop titles, e.g.
 * "Havells HD3151 1200 W Foldable Hair Dryer; 3 Heat (Hot/Cool/Warm) Settings…" → "Havells HD3151 1200 W Foldable Hair Dryer".
 * Returns null when the title is already short or can't be shortened sensibly.
 */
const MAX_WORDS = 7;

export function shortTitle(title: string): string | null {
  const t = title.trim();
  if (t.length <= 40) return null;
  let s = t
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ") // specs in brackets
    .split(/\s*[;|,]\s*|\s+[–—-]\s+|\s+with\s+/i)[0]
    .replace(/\s+/g, " ")
    .trim();
  const words = s.split(" ");
  if (words.length > MAX_WORDS) s = words.slice(0, MAX_WORDS).join(" ");
  s = s.replace(/[\s,;:&/-]+$/, "");
  if (s.length < 8 || s === t) return null;
  return s;
}
