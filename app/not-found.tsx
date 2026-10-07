import Link from "next/link";
import { BrandMark } from "@/components/Icon";

export default function NotFound() {
  return (
    <main className="status-page">
      <Link href="/" className="brand"><BrandMark /> Haulbook</Link>
      <h1>We couldn&apos;t find that page</h1>
      <p className="muted">The link may be old or mistyped.</p>
      <div className="status-actions">
        <Link href="/home" className="btn btn-primary">Go to your products</Link>
        <Link href="/" className="btn btn-secondary">Home page</Link>
      </div>
    </main>
  );
}
