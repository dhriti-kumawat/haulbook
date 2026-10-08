import { prisma } from "@/lib/prisma";
import { productView, TYPE_LABEL } from "@/lib/products";
import { requireUser } from "@/lib/session";
import { hasPro, PRO_REQUIRED } from "@/lib/plan";
import { NextResponse } from "next/server";

const COLUMNS = [
  "Product", "Type", "Shop or brand", "Price paid", "Collab fee", "Deliverables",
  "Ordered", "Delivered", "Filmed", "Posted", "Post link", "Returned", "Refunded", "Kept", "Paid",
  "Return by", "Post by", "Product link", "Notes",
];

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

/** CSV cell: quoted, and protected against spreadsheet formula injection. */
function cell(value: unknown) {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Downloads all of the user's products as a CSV file that opens in Excel, Numbers or Google Sheets. */
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!hasPro(user)) return NextResponse.json(PRO_REQUIRED("CSV export"), { status: 402 });
  const products = (await prisma.product.findMany({ where: { userId: user.id, isSample: false }, orderBy: { orderedAt: "desc" } })).map((p) =>
    productView(p)
  );
  const rows = products.map((p) =>
    [
      p.title, TYPE_LABEL[p.type], p.shop, p.price, p.fee, p.deliverables,
      day(p.orderedAt), day(p.deliveredAt), day(p.filmedAt), day(p.postedAt), p.postUrl, day(p.returnedAt), day(p.refundedAt),
      day(p.keptAt), day(p.paidAt), day(p.returnBy), day(p.postBy), p.url, p.notes,
    ].map(cell).join(",")
  );
  // A byte-order mark makes Excel read ₹ and other characters correctly.
  const csv = "﻿" + [COLUMNS.map(cell).join(","), ...rows].join("\r\n");
  const name = `haulbook-products-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
