import { Icon } from "./Icon";
import { PLAN_GROUPS } from "@/lib/plan";

function Mark({ v }: { v: string | boolean }) {
  if (typeof v === "string") return <span className="pc-text">{v}</span>;
  return v ? <span className="pc-yes" aria-label="Included"><Icon name="check" size={15} /></span> : <span className="pc-no" aria-label="Not included">–</span>;
}

/** Full Free vs Pro comparison table, grouped by area. */
export function PlanCompare() {
  return (
    <div className="pc-wrap">
      <table className="pc">
        <thead>
          <tr><th scope="col"><span className="sr-only">Feature</span></th><th scope="col">Free</th><th scope="col">Pro</th></tr>
        </thead>
        {PLAN_GROUPS.map((g) => (
          <tbody key={g.title}>
            <tr className="pc-group"><th scope="rowgroup" colSpan={3}>{g.title}</th></tr>
            {g.rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                <td><Mark v={r.free} /></td>
                <td><Mark v={r.pro} /></td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
