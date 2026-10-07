import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

const SIZES = [180, 192, 512];

/** App icons drawn from the logo: a shopping bag with a tick on a lavender square. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.includes(size)) return new Response("Not found", { status: 404 });
  // Maskable icons need extra padding so phones can crop them into circles.
  const maskable = req.nextUrl.searchParams.has("maskable");
  const glyph = Math.round(size * (maskable ? 0.42 : 0.56));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#8a7fd6",
          borderRadius: maskable || size === 180 ? 0 : Math.round(size * 0.22),
        }}
      >
        <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 8h14l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zM9 8V6a3 3 0 0 1 6 0v2M9.5 14.5l2 2 3.5-4" />
        </svg>
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=604800, immutable" } }
  );
}
