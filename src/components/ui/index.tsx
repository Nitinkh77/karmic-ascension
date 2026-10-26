import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
  narrow = false,
}: {
  className?: string;
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className={cn("mx-auto w-full px-5 sm:px-8", narrow ? "max-w-3xl" : "max-w-6xl", className)}>
      {children}
    </div>
  );
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

export function buttonStyles(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "spring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold tracking-wide",
    "disabled:cursor-not-allowed disabled:opacity-60",
    size === "lg" && "min-h-12 px-7 text-base",
    size === "md" && "min-h-11 px-5 text-sm",
    size === "sm" && "min-h-9 px-4 text-sm",
    variant === "primary" &&
      "bg-maroon-deep text-leaf-soft shadow-card ring-1 ring-inset ring-leaf/60 hover:bg-leaf hover:text-night",
    variant === "secondary" &&
      "border border-gold bg-transparent text-maroon hover:bg-parchment",
    variant === "ghost" && "text-maroon hover:bg-maroon-soft",
    variant === "danger" && "border border-danger bg-white-warm text-danger hover:bg-red-50",
    className,
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonStyles(variant, size, className)} {...props} />;
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonStyles(variant, size, className)} {...props} />;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  as: Tag = "h2",
  className,
}: {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  align?: "center" | "left";
  as?: "h1" | "h2";
  className?: string;
}) {
  if (!eyebrow && !title && !description) return null;
  return (
    <div className={cn(align === "center" ? "mx-auto text-center" : "text-left", "max-w-2xl", className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      {title && (
        <Tag className="text-3xl text-maroon sm:text-4xl md:text-[2.75rem]">{title}</Tag>
      )}
      {description && <p className="mt-4 text-lg text-ink-soft">{description}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = "gold",
}: {
  children: ReactNode;
  tone?: "gold" | "maroon" | "green" | "grey" | "red" | "saffron";
}) {
  const tones = {
    gold: "bg-parchment text-gold-deep border-gold-soft",
    maroon: "bg-maroon-soft text-maroon border-maroon/20",
    green: "bg-green-50 text-success border-green-200",
    grey: "bg-stone-100 text-stone-700 border-stone-200",
    red: "bg-red-50 text-danger border-red-200",
    saffron: "bg-saffron-soft text-saffron-deep border-saffron/30",
  } as const;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

/** Splits plain text into paragraphs; "## Heading" lines become h2. */
export function RichText({ text, className }: { text: string | null | undefined; className?: string }) {
  if (!text) return null;
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className={cn("prose-ka text-ink-soft", className)}>
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) {
          const [head, ...rest] = b.split("\n");
          return (
            <div key={i}>
              <h2>{head.slice(3)}</h2>
              {rest.length > 0 && <p className="whitespace-pre-line">{rest.join("\n")}</p>}
            </div>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line">
            {b}
          </p>
        );
      })}
    </div>
  );
}
