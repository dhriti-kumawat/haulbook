import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/Icon";
import { UserMenu } from "@/components/UserMenu";
import { BottomNav, TopNav } from "@/components/AppNav";
import { ProductsProvider } from "@/components/ProductsProvider";
import { PullToRefresh } from "@/components/PullToRefresh";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <ProductsProvider>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/home" className="brand"><BrandMark /> Haulbook</Link>
          <TopNav />
          <UserMenu name={session.user?.name} email={session.user?.email} />
        </div>
      </header>
      <PullToRefresh />
      <main className="container">{children}</main>
      <BottomNav />
    </ProductsProvider>
  );
}
