"use client";

import { useRef, useState } from "react";
import { compressImage } from "@/lib/compressImage";
import { Icon } from "./Icon";
import { ProductThumb } from "./ProductThumb";

/** Shows the product photo with buttons to upload a new one or remove it. */
export function PhotoPicker({
  title,
  imageUrl,
  onChange,
  size = 96,
}: {
  title: string;
  imageUrl: string | null;
  onChange: (imageUrl: string | null) => void;
  size?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      onChange(await compressImage(file));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="photo-picker">
      <ProductThumb title={title || "Product"} imageUrl={imageUrl} size={size} />
      <div className="photo-picker-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => input.current?.click()} disabled={busy}>
          <Icon name="plus" size={14} /> {busy ? "Preparing…" : imageUrl ? "Change photo" : "Upload photo"}
        </button>
        {imageUrl && (
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => onChange(null)}>
            Remove
          </button>
        )}
        <span className="hint">{error || "A screenshot works too."}</span>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => pick(e.target.files?.[0])}
        aria-label="Upload product photo"
      />
    </div>
  );
}
