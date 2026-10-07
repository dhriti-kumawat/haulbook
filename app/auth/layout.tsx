"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/Icon";
import { HeroVisual } from "@/components/HeroVisual";


export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/home");
    }
  }, [status, router]);

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <span className="brand"><BrandMark /> Haulbook</span>
        <div>
          <h2>Review more. <span className="accent-text">Lose nothing.</span></h2>
          <p>Return windows, posting dates, refunds and brand payments for every product you review, counted down for you.</p>
          <HeroVisual />
        </div>
        <span className="muted" style={{ fontSize: 13 }}>Built for creators. Your data stays in your account.</span>
      </aside>
      {/* Phones: just the logo above the form. */}
      <header className="auth-mtop">
        <Link href="/" className="brand"><BrandMark /> Haulbook</Link>
      </header>
      <main className="auth-main">{children}</main>
    </div>
  );
}
