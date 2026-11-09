export function Section({
  id,
  eyebrow,
  title,
  intro,
  tone = "plain",
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  intro?: React.ReactNode;
  tone?: "plain" | "surface" | "linen";
  children: React.ReactNode;
}) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`border-t border-line ${tone === "surface" ? "bg-surface" : tone === "linen" ? "bg-linen" : ""}`}
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:py-20">
        <div className="grid max-w-2xl gap-3">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2 id={headingId} className="text-[32px] font-medium leading-[1.1] md:text-[42px]">
            {title}
          </h2>
          {intro && <p className="text-lg text-muted">{intro}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-honey">{children}</p>;
}
