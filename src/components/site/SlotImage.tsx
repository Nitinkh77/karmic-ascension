"use client";

import Image from "next/image";
import { useState } from "react";
import { Mandala } from "@/components/art/Mandala";

/** Image that quietly falls back to the ornamental placeholder if the file is missing. */
export function SlotImage({
  src,
  alt,
  sizes,
  priority,
  unoptimized,
  frameClassName,
  placeholderClassName,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority: boolean;
  unoptimized: boolean;
  frameClassName: string;
  placeholderClassName: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={placeholderClassName} role="img" aria-label={alt || "Decorative mandala"}>
        <Mandala className="h-[78%] w-[78%] text-gold" />
      </div>
    );
  }
  return (
    <div className={frameClassName}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized}
        onError={() => setFailed(true)}
        className="object-cover"
      />
    </div>
  );
}
