import Image from "next/image";
import { Icon } from "./Icon";

const ROWS = [
  { title: "SUGAR Matte As Hell Crayon Lipstick", meta: "PR · Reel due Fri", chip: "Post in 3d", tone: "is-soon", img: "/landing/lipstick.jpg" },
  { title: "Minimalist 10% Niacinamide Serum", meta: "PR · Filmed", chip: "Post in 5d", tone: "", img: "/landing/serum.jpg" },
  { title: "Dyson Supersonic Hair Dryer", meta: "Bought · ₹24,900", chip: "Return in 2d", tone: "is-urgent", img: "/landing/dyson.jpg" },
];

/**
 * Landing hero visual: a soft gradient panel with a floating preview of the app
 * and sticker-style badges. Everything is positioned inside the panel, so it never overflows.
 * Photos: public/landing/CREDITS.md
 */
export function HeroVisual() {
  return (
    <div className="hv" aria-hidden="true">
      <div className="hv-app">
        <div className="hv-app-head">
          <span className="hv-dots"><i /><i /><i /></span>
          <span className="hv-app-title">Needs you</span>
          <span className="hv-count">3</span>
        </div>
        <ul className="hv-rows">
          {ROWS.map((r) => (
            <li key={r.title}>
              <span className="hv-thumb">
                <Image src={r.img} alt="" fill sizes="44px" priority />
              </span>
              <span className="hv-text">
                <b>{r.title}</b>
                <span>{r.meta}</span>
              </span>
              <span className={`deadline-chip ${r.tone}`}>{r.chip}</span>
            </li>
          ))}
        </ul>
        <div className="hv-money">
          <span>Still to come back to you</span>
          <b className="num">₹24,580</b>
        </div>
      </div>

      <span className="hv-badge hv-badge-1">
        <span className="hv-badge-icon is-ok"><Icon name="check" size={13} /></span>
        Posted · Reel is live
      </span>
      <span className="hv-badge hv-badge-2">
        <span className="hv-badge-icon is-accent"><Icon name="rupee" size={13} /></span>
        ₹12,000 collab paid
      </span>
      <span className="hv-badge hv-badge-3">
        <span className="hv-badge-thumb">
          <Image src="/landing/lotion.jpg" alt="" fill sizes="26px" priority />
        </span>
        Payment 10d late
      </span>
    </div>
  );
}
