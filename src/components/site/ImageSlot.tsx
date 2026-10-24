import { SlotImage } from "@/components/site/SlotImage";
import { Mandala } from "@/components/art/Mandala";
import { cn } from "@/lib/utils";

/**
 * Reusable image slot. Shows the admin-selected image when one is set,
 * otherwise an intentional ornamental placeholder (original SVG art, no text),
 * so the layout never looks broken before real photography is added.
 * Photos are managed in Admin → Media and chosen per section / service.
 */
export function ImageSlot({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 480px, 100vw",
  priority = false,
  shape = "rounded",
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  shape?: "rounded" | "arch";
}) {
  const radius = shape === "arch" ? "rounded-t-[999px] rounded-b-2xl" : "rounded-2xl";
  if (src) {
    const local = /\/\/(localhost|127\.0\.0\.1)/.test(src);
    return (
      <SlotImage
        src={src}
        alt={alt ?? ""}
        sizes={sizes}
        priority={priority}
        unoptimized={local}
        frameClassName={cn("ornate-frame relative overflow-hidden", radius, className)}
        placeholderClassName={cn("ornate-frame relative flex items-center justify-center overflow-hidden bg-parchment", radius, className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "ornate-frame relative flex items-center justify-center overflow-hidden bg-parchment",
        radius,
        className,
      )}
      role="img"
      aria-label={alt || "Decorative mandala"}
    >
      <Mandala className="h-[78%] w-[78%] text-gold" />
    </div>
  );
}
