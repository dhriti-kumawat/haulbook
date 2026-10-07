/** Photo credits and brand note for the landing page. Linked from the landing footer. */
import Link from "next/link";
import { BrandMark } from "@/components/Icon";

export const metadata = { title: "Credits · Haulbook" };

export default function Credits() {
  return (
    <div className="landing credits">
      <header className="l-header">
        <Link href="/" className="brand"><BrandMark /> Haulbook</Link>
      </header>
      <main>
        <h1 className="l-h2">Credits</h1>
        <p>
          Product photos on the home page are from <a href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a>,
          except the Dyson Supersonic photo by{" "}
          <a href="https://commons.wikimedia.org/wiki/File:Dyson_Supersonic_Hair_Dryer_1_2017-01-28.jpg" target="_blank" rel="noreferrer">FASTILY</a>,
          licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a> and cropped.
        </p>
        <p>
          Brand and product names on the home page are examples of products creators review. Haulbook is not affiliated with these brands.
        </p>
        <p><Link href="/">Back to home</Link></p>
      </main>
    </div>
  );
}
