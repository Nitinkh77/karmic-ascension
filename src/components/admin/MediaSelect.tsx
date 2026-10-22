"use client";

import Image from "next/image";
import { useState } from "react";
import type { MediaAsset } from "@/lib/types";

/** Select an uploaded image (with live preview). Empty = use the default ornament. */
export function MediaSelect({
  name,
  assets,
  defaultValue,
  label = "Image",
}: {
  name: string;
  assets: MediaAsset[];
  defaultValue?: string | null;
  label?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const current = assets.find((a) => a.id === value);
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-charcoal">
        {label}
      </label>
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-sand bg-parchment">
          {current?.url ? (
            <Image src={current.url} alt={current.alt_text} fill sizes="112px" className="object-cover" unoptimized />
          ) : (
            <span className="flex h-full items-center justify-center px-2 text-center text-xs text-ink-soft">
              Default ornament
            </span>
          )}
        </div>
        <div className="flex-1">
          <select id={name} name={name} className="field" value={value} onChange={(e) => setValue(e.target.value)}>
            <option value="">— None (default ornament) —</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.folder} / {a.storage_path.split("/").pop()}
              </option>
            ))}
          </select>
          {assets.length === 0 && (
            <p className="mt-1 text-xs text-ink-soft">No images yet — upload some in Media library first.</p>
          )}
        </div>
      </div>
    </div>
  );
}
