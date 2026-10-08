"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { initials } from "@/lib/format";
import { Icon } from "./Icon";

export function UserMenu({ name, email }: { name?: string | null; email?: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="avatar-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="avatar">{initials(name, email)}</span>
        <span className="name">{name || email}</span>
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-head">
            <strong>{name || "Your account"}</strong>
            <span>{email}</span>
          </div>
          <Link href="/settings" role="menuitem" className="menu-item" onClick={() => setOpen(false)} style={{ textDecoration: "none" }}>
            <Icon name="settings" size={16} /> Settings
          </Link>
          <Link href="/help" role="menuitem" className="menu-item" onClick={() => setOpen(false)} style={{ textDecoration: "none" }}>
            <Icon name="book" size={15} /> Help
          </Link>
          <button type="button" role="menuitem" className="menu-item" onClick={() => signOut({ callbackUrl: "/" })}>
            <Icon name="logout" size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
