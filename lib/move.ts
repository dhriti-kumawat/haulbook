import type { ProductView, StepKey } from "./products";
import { STEP_FIELD } from "./products";
import { bucketOf, type Bucket } from "./summary";

export const MOVABLE_BUCKETS: Bucket[] = ["receive", "film", "post", "return", "money", "done"];

type StepField = "deliveredAt" | "filmedAt" | "postedAt" | "returnedAt" | "refundedAt" | "paidAt" | "keptAt";
const STEP_FIELDS: StepField[] = ["deliveredAt", "filmedAt", "postedAt", "returnedAt", "refundedAt", "paidAt", "keptAt"];

/** Columns a product may be moved to. PR products have no return or money step. */
export function canMoveTo(p: ProductView, target: Bucket): boolean {
  if (target === "return") return p.type === "bought";
  if (target === "money") return p.type !== "pr";
  return true;
}

/**
 * The step changes that put a product into `target`.
 * Steps before the target are filled in (keeping any date already set),
 * steps from the target on are cleared.
 * Returns null when the product is already there or cannot go there.
 */
export function patchForMove(p: ProductView, target: Bucket): Record<StepField, string | null> | null {
  if (!canMoveTo(p, target) || bucketOf(p) === target) return null;
  const now = new Date().toISOString();
  const keep = (field: StepField) => (p[field] as string | null) ?? now;

  const done: StepField[] = (() => {
    switch (target) {
      case "receive":
        return [];
      case "film":
        return ["deliveredAt"];
      case "post":
        return ["deliveredAt", "filmedAt"];
      case "return":
        return ["deliveredAt", "filmedAt", "postedAt"];
      case "money":
        return p.type === "bought" ? ["deliveredAt", "filmedAt", "postedAt", "returnedAt"] : ["deliveredAt", "filmedAt", "postedAt"];
      case "done":
        return p.type === "bought"
          ? ["deliveredAt", "filmedAt", "postedAt", "returnedAt", "refundedAt"]
          : p.type === "collab"
            ? ["deliveredAt", "filmedAt", "postedAt", "paidAt"]
            : ["deliveredAt", "filmedAt", "postedAt"];
    }
  })();

  const patch = {} as Record<StepField, string | null>;
  for (const field of STEP_FIELDS) patch[field] = done.includes(field) ? keep(field) : null;
  // A kept purchase that is moved back into the pipeline is no longer kept.
  if (target !== "done") patch.keptAt = null;
  else if (p.keptAt) {
    // Finished by keeping it: no return or refund needed.
    patch.keptAt = p.keptAt;
    patch.returnedAt = null;
    patch.refundedAt = null;
  }
  return patch;
}

/** The step fields as they are now, to undo a move. */
export function snapshotSteps(p: ProductView): Record<StepField, string | null> {
  const snap = {} as Record<StepField, string | null>;
  for (const field of STEP_FIELDS) snap[field] = p[field] as string | null;
  return snap;
}

/** Steps a step depends on: ticking it ticks these too. Returning doesn't need filming (a product can go back unused). */
const NEEDS: Record<StepKey, StepKey[]> = {
  delivered: [],
  filmed: ["delivered"],
  posted: ["delivered", "filmed"],
  returned: ["delivered"],
  refunded: ["delivered", "returned"],
  paid: ["delivered", "filmed", "posted"],
};

/**
 * Patch for ticking or unticking one step in the product panel, keeping the steps consistent:
 * ticking "Posted" also ticks "Delivered" and "Filmed"; unticking "Delivered" clears everything after it.
 */
export function patchForStep(p: ProductView, step: StepKey, done: boolean): Record<string, string | null> {
  const now = new Date().toISOString();
  const patch: Record<string, string | null> = {};
  if (done) {
    patch[STEP_FIELD[step]] = now;
    for (const need of NEEDS[step]) {
      const field = STEP_FIELD[need] as string;
      if (!(p as unknown as Record<string, unknown>)[field]) patch[field] = now;
    }
    if (step === "returned" || step === "refunded") patch.keptAt = null;
  } else {
    patch[STEP_FIELD[step]] = null;
    for (const [later, needs] of Object.entries(NEEDS) as [StepKey, StepKey[]][]) {
      if (needs.includes(step)) patch[STEP_FIELD[later] as string] = null;
    }
    // Not arrived means not kept either (otherwise the server would mark it delivered again).
    if (step === "delivered") patch.keptAt = null;
  }
  return patch;
}
