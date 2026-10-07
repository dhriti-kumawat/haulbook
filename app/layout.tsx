import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Haulbook — every product you review, in one place",
  description: "Track every product you review: what to film, what to post, what to return, and which refunds and payments are still owed.",
  appleWebApp: { capable: true, title: "Haulbook", statusBarStyle: "default" },
  icons: { icon: [{ url: "/icons/192", type: "image/png" }], apple: [{ url: "/icons/180", sizes: "180x180" }] },
};

export const viewport: Viewport = {
  themeColor: "#f4f1fa",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
