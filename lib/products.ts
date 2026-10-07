import type { Product } from "@prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;
/** A refund is "late" this many days after the return. */
export const REFUND_GRACE_DAYS = 7;
/** A collab payment is "late" this many days after posting. */
export const PAYMENT_GRACE_DAYS = 30;

export type ProductType = "bought" | "pr" | "collab";
export const PRODUCT_TYPES: ProductType[] = ["bought", "pr", "collab"];
export const TYPE_LABEL: Record<ProductType, string> = { bought: "Bought", pr: "PR", collab: "Paid collab" };

export type StepKey = "delivered" | "filmed" | "posted" | "returned" | "refunded" | "paid";
export const STEP_FIELD: Record<StepKey, keyof Product> = {
  delivered: "deliveredAt",
  filmed: "filmedAt",
  posted: "postedAt",
  returned: "returnedAt",
  refunded: "refundedAt",
  paid: "paidAt",
};
export const STEP_LABEL: Record<StepKey, string> = {
  delivered: "Delivered",
  filmed: "Filmed",
  posted: "Posted",
  returned: "Returned",
  refunded: "Refunded",
  paid: "Paid",
};

/** The steps each kind of product goes through, in order. */
export function stepsFor(type: ProductType, kept: boolean): StepKey[] {
  if (type === "pr") return ["delivered", "filmed", "posted"];
  if (type === "collab") return ["delivered", "filmed", "posted", "paid"];
  return kept ? ["delivered", "filmed", "posted"] : ["delivered", "filmed", "posted", "returned", "refunded"];
}

export type DeadlineKind = "return" | "post" | "refund" | "payment";

export interface Deadline {
  kind: DeadlineKind;
  /** Days until the deadline; negative means overdue. For refund/payment: negative days late. */
  days: number;
  date: string;
  label: string;
}

export type Stage = "ordered" | "film" | "post" | "return" | "refund" | "payment" | "done";

export type NextAction =
  | { kind: "step"; step: StepKey; label: string }
  | { kind: "none" };

export interface ProductView {
  id: string;
  title: string;
  type: ProductType;
  shop: string | null;
  url: string | null;
  imageUrl: string | null;
  price: number | null;
  fee: number | null;
  deliverables: string | null;
  notes: string | null;
  orderedAt: string;
  deliveredAt: string | null;
  filmedAt: string | null;
  postedAt: string | null;
  postUrl: string | null;
  returnedAt: string | null;
  refundedAt: string | null;
  keptAt: string | null;
  paidAt: string | null;
  returnWindowDays: number | null;
  returnBy: string | null;
  postBy: string | null;
  createdAt: string;
  isSample: boolean;

  steps: { key: StepKey; done: boolean; at: string | null }[];
  stage: Stage;
  deadlines: Deadline[];
  /** The most pressing deadline, if any. */
  urgent: Deadline | null;
  next: NextAction;
  /** Money still to come back: purchase price not yet refunded, or collab fee not yet paid. */
  moneyOut: number;
}

const iso = (d: Date | null) => d?.toISOString() ?? null;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
const daysBetween = (from: Date, to: Date) => Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);

export function productView(p: Product, now = new Date()): ProductView {
  const type = (PRODUCT_TYPES.includes(p.type as ProductType) ? p.type : "bought") as ProductType;
  const kept = Boolean(p.keptAt);
  const steps = stepsFor(type, kept).map((key) => {
    const at = p[STEP_FIELD[key]] as Date | null;
    return { key, done: Boolean(at), at: iso(at) };
  });
  const done = (k: StepKey) => Boolean(p[STEP_FIELD[k]]);

  // ---- Deadlines ----
  const deadlines: Deadline[] = [];
  const returnBy =
    p.returnBy ?? (p.deliveredAt && p.returnWindowDays != null ? new Date(p.deliveredAt.getTime() + p.returnWindowDays * DAY_MS) : null);

  if (type === "bought" && !kept && !done("returned") && returnBy) {
    const days = daysBetween(now, returnBy);
    deadlines.push({
      kind: "return",
      days,
      date: returnBy.toISOString(),
      label: days < 0 ? "Return window closed" : days === 0 ? "Return today" : `Return in ${days}d`,
    });
  }
  if (type !== "bought" && !done("posted") && p.postBy) {
    const days = daysBetween(now, p.postBy);
    deadlines.push({
      kind: "post",
      days,
      date: p.postBy.toISOString(),
      label: days < 0 ? `Post ${-days}d late` : days === 0 ? "Post today" : `Post in ${days}d`,
    });
  }
  if (type === "bought" && done("returned") && !done("refunded")) {
    const due = new Date(p.returnedAt!.getTime() + REFUND_GRACE_DAYS * DAY_MS);
    const days = daysBetween(now, due);
    deadlines.push({
      kind: "refund",
      days,
      date: due.toISOString(),
      label: days < 0 ? `Refund ${-days}d late` : "Refund pending",
    });
  }
  if (type === "collab" && done("posted") && !done("paid")) {
    const due = new Date(p.postedAt!.getTime() + PAYMENT_GRACE_DAYS * DAY_MS);
    const days = daysBetween(now, due);
    deadlines.push({
      kind: "payment",
      days,
      date: due.toISOString(),
      label: days < 0 ? `Payment ${-days}d late` : "Payment pending",
    });
  }
  // A closed return window is history, not a call to action.
  const actionable = deadlines.filter((d) => !(d.kind === "return" && d.days < 0));
  const urgent = actionable.sort((a, b) => a.days - b.days)[0] ?? null;

  // ---- Stage + next action ----
  let stage: Stage;
  let next: NextAction;
  const returnSoon = deadlines.find((d) => d.kind === "return" && d.days >= 0 && d.days <= 3);

  if (!done("delivered")) {
    stage = "ordered";
    next = { kind: "step", step: "delivered", label: type === "bought" ? "Mark delivered" : "Mark received" };
  } else if (returnSoon) {
    // About to lose the refund: returning beats filming.
    stage = "return";
    next = { kind: "step", step: "returned", label: "Mark returned" };
  } else if (type === "bought" && !kept && done("returned")) {
    // Once it's sent back there's nothing left to film or post; only the refund matters.
    stage = done("refunded") ? "done" : "refund";
    next = done("refunded") ? { kind: "none" } : { kind: "step", step: "refunded", label: "Refund received" };
  } else if (!done("filmed")) {
    stage = "film";
    next = { kind: "step", step: "filmed", label: "Mark filmed" };
  } else if (!done("posted")) {
    stage = "post";
    next = { kind: "step", step: "posted", label: "Mark posted" };
  } else if (type === "bought" && !kept && !done("returned")) {
    const closed = deadlines.some((d) => d.kind === "return" && d.days < 0);
    stage = closed ? "done" : "return";
    next = closed ? { kind: "none" } : { kind: "step", step: "returned", label: "Mark returned" };
  } else if (type === "bought" && !kept && !done("refunded")) {
    stage = "refund";
    next = { kind: "step", step: "refunded", label: "Refund received" };
  } else if (type === "collab" && !done("paid")) {
    stage = "payment";
    next = { kind: "step", step: "paid", label: "Payment received" };
  } else {
    stage = "done";
    next = { kind: "none" };
  }

  const moneyOut =
    type === "bought" && !kept && !done("refunded") && !deadlines.some((d) => d.kind === "return" && d.days < 0)
      ? p.price ?? 0
      : type === "collab" && !done("paid")
        ? p.fee ?? 0
        : 0;

  return {
    id: p.id,
    title: p.title,
    type,
    shop: p.shop,
    url: p.url,
    imageUrl: p.imageUrl,
    price: p.price,
    fee: p.fee,
    deliverables: p.deliverables,
    notes: p.notes,
    orderedAt: p.orderedAt.toISOString(),
    deliveredAt: iso(p.deliveredAt),
    filmedAt: iso(p.filmedAt),
    postedAt: iso(p.postedAt),
    postUrl: p.postUrl,
    returnedAt: iso(p.returnedAt),
    refundedAt: iso(p.refundedAt),
    keptAt: iso(p.keptAt),
    paidAt: iso(p.paidAt),
    returnWindowDays: p.returnWindowDays,
    returnBy: iso(returnBy),
    postBy: iso(p.postBy),
    createdAt: p.createdAt.toISOString(),
    isSample: p.isSample,
    steps,
    stage,
    deadlines,
    urgent,
    next,
    moneyOut,
  };
}
