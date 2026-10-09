/** Questions and answers for the landing page (the main ones) and the Help page (all of them). */
export interface Faq { q: string; a: string }

export const FAQ_GROUPS: { title: string; items: Faq[] }[] = [
  {
    title: "Getting started",
    items: [
      { q: "Is Haulbook free?", a: "Yes, Free is free forever and covers up to 25 products in progress. Pro adds unlimited products, phone and WhatsApp reminders, earnings and invoices for ₹99 a month during early access (usually ₹199)." },
      { q: "Do I need to install anything?", a: "No. Haulbook runs in your browser. On your phone, add it to your home screen and it opens like an app." },
      { q: "Can I use it on my phone and laptop?", a: "Yes. Sign in on both and you see the same products everywhere." },
      { q: "Which shops does adding by link work with?", a: "Most online shops in India and abroad. If a shop blocks it, Haulbook keeps the name from the link and you add the price and a photo or screenshot." },
      { q: "Can I add a product by speaking?", a: "Yes. In Add product, tap the mic and say what it is, where it's from and when it's due, in English or Hinglish. The details fill in for you to check." },
    ],
  },
  {
    title: "Reminders",
    items: [
      { q: "How does the return countdown work?", a: "It counts from the day the product arrived, using the shop's return window. Set a shop's window once and every new product from it uses it." },
      { q: "Will I get a lot of emails?", a: "No. One short email, only on days something is due or newly late. Turn it off any time in Settings." },
      { q: "Will WhatsApp reminders spam me?", a: "No. They're off until you turn them on, and it's one message only on days something is due or late." },
    ],
  },
  {
    title: "Earnings and invoices",
    items: [
      { q: "What does Earnings show?", a: "Collab earnings and what's still due, refunds recovered and pending, and the value of gifted products, for each financial year (April to March), with a spreadsheet for tax time." },
      { q: "Can I send invoices to brands?", a: "Yes. Each paid collab gets a numbered invoice with your details and UPI or bank info. Save it as a PDF and send it." },
      { q: "Does the invoice include GST?", a: "It shows your GSTIN and PAN if you add them. Amounts are what you enter; check tax details with your CA." },
      { q: "Can I share a report with a brand?", a: "Yes. Each brand gets a report of what you received, what you posted with links, and what you were paid. Print it or save it as a PDF." },
    ],
  },
  {
    title: "Plans",
    items: [
      { q: "How much does Pro cost?", a: "₹199 a month. During early access it's ₹99 a month, and you keep that price. Payments open soon; until then every Pro feature is unlocked." },
      { q: "What happens to my products if I go back to Free?", a: "Nothing is deleted. You keep everything; Free just limits how many products can be in progress and turns off Pro-only features." },
    ],
  },
  {
    title: "Privacy",
    items: [
      { q: "Who can see my products?", a: "Only you. Your products, earnings and invoices are private to your account." },
      { q: "What happens to what I say?", a: "Your browser turns speech into text, and only that text is sent to our AI to fill in the form. Recordings aren't kept." },
      { q: "Can I take my data with me?", a: "Yes. Download everything as a spreadsheet from Settings at any time." },
    ],
  },
];

const ALL = FAQ_GROUPS.flatMap((g) => g.items);
const pick = (q: string) => ALL.find((f) => f.q === q)!;

/** The six shown on the landing page (two columns of three); the rest live on /help. */
export const MAIN_FAQ: Faq[] = [
  pick("Is Haulbook free?"),
  pick("Do I need to install anything?"),
  pick("Which shops does adding by link work with?"),
  pick("How does the return countdown work?"),
  pick("Who can see my products?"),
  pick("What happens to what I say?"),
];
