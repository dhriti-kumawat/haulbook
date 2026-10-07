import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LandingPage } from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Haulbook — every product you review, in one place",
  description:
    "For creators who review products. Track what to film, what to post, what to return before the window closes, and which refunds and brand payments are still owed.",
};

export default async function Landing({ searchParams }: { searchParams: { preview?: string } }) {
  // In development, /?preview=landing shows this page even when signed in.
  const previewing = process.env.NODE_ENV !== "production" && searchParams.preview === "landing";
  if (!previewing) {
    const session = await getServerSession(authOptions);
    if (session) redirect("/home");
  }
  return <LandingPage />;
}
