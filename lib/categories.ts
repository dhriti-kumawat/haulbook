import type { IconName } from "@/components/Icon";

export interface Category {
  icon: IconName;
  /** Hue used for the soft icon tile. */
  hue: number;
}

// First match wins, so more specific words come before general ones.
const RULES: [RegExp, Category][] = [
  [/\b(shoe|shoes|sneaker|sneakers|sandal|sandals|slipper|slippers|heels|boots?|loafers?|flip.?flops?|pegasus|running|trainers?|crocs)\b/i, { icon: "shoe", hue: 28 }],
  [/\b(jeans|pants|trousers|chinos|palazzo|shorts|leggings|joggers|skirt)\b/i, { icon: "pants", hue: 220 }],
  [/\b(shirt|t-?shirt|tee|top|kurta|kurti|dress|saree|sari|dupatta|hoodie|jacket|sweater|blazer|socks?|jersey|lehenga|coat)\b/i, { icon: "shirt", hue: 345 }],
  [/\b(earbuds|earphones?|headphones?|headset|speaker|airpods|airdopes|buds|wh-\d+\w*|neckband)\b/i, { icon: "headphones", hue: 250 }],
  [/\b(phone|iphone|mobile|case|charger|cable|power ?bank|tablet|ipad)\b/i, { icon: "phone", hue: 205 }],
  [/\b(keyboard|mouse|laptop|monitor|webcam|router|ssd|usb)\b/i, { icon: "keyboard", hue: 230 }],
  [/\b(watch|smartwatch|band)\b/i, { icon: "watch", hue: 190 }],
  [/\b(lamp|bulb|light|pillow|bedsheet|curtain|cushion|mug|pan|kettle|towel|decor|fryer|mixer|blender|vacuum|purifier)\b/i, { icon: "lamp", hue: 45 }],
  [/\b(bottle|flask|tumbler|quencher)\b/i, { icon: "bottle", hue: 170 }],
  [/\b(yoga|mat|dumbbell|gym|cycle|bicycle|racket|ball|fitness)\b/i, { icon: "dumbbell", hue: 150 }],
  [/\b(lipstick|serum|cream|shampoo|perfume|makeup|cosmetic|moisturi[sz]er|sunscreen|spf|kajal|niacinamide|airwrap|hair ?dryer|straightener|trimmer)\b/i, { icon: "sparkle", hue: 320 }],
  [/\b(book|notebook|novel|diary|pen|pens)\b/i, { icon: "book", hue: 35 }],
  [/\b(bag|tote|backpack|wallet|purse|sunglasses|belt|cap)\b/i, { icon: "bag", hue: 15 }],
];

const FALLBACK: Category = { icon: "box", hue: 260 };

export function categoryFor(name: string): Category {
  return RULES.find(([re]) => re.test(name))?.[1] ?? FALLBACK;
}
