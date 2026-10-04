import Link from "next/link";

type Variant = "primary" | "secondary";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold no-underline transition-colors duration-150 motion-reduce:transition-none";

const sizes: Record<Size, string> = {
  md: "min-h-12 px-6 text-base",
  sm: "min-h-11 px-5 text-[15px]",
};

const variants: Record<Variant, string> = {
  primary: "bg-blue text-on-blue hover:bg-blue-deep",
  secondary: "border-[1.5px] border-line text-blue hover:border-blue",
};

/** Extra classes must not repeat display, height, padding or font size; use `size` instead. */
export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${sizes[size]} ${variants[variant]} ${extra}`;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
