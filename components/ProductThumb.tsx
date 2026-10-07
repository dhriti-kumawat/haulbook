"use client";

import { useState } from "react";
import { categoryFor } from "@/lib/categories";
import { Icon } from "./Icon";

/** Product photo when there is one, otherwise a soft tile with an icon guessed from the title. */
export function ProductThumb({ title, imageUrl, size = 56 }: { title: string; imageUrl: string | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  const { icon, hue } = categoryFor(title);
  if (imageUrl && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="thumb"
        src={imageUrl}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        onError={() => setBroken(true)}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span className="thumb thumb-icon" style={{ width: size, height: size, ["--h" as string]: hue }} aria-hidden="true">
      <Icon name={icon} size={Math.round(size * 0.42)} />
    </span>
  );
}
