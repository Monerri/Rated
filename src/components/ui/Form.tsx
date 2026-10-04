import { useId } from "react";

const inputClass =
  "min-h-[52px] w-full rounded-lg border-[1.5px] border-line bg-surface px-3.5 text-[17px] text-ink focus:border-blue focus:outline-none focus:ring-[3px] focus:ring-blue-tint aria-[invalid=true]:border-ink";

export function TextField({
  label,
  hint,
  error,
  ...props
}: {
  label: string;
  hint?: string;
  error?: string | null;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[15px] font-semibold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="-mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
      <input
        id={id}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm font-semibold text-ink">
          {error}
        </p>
      )}
    </div>
  );
}

/** A consent tick box whose label is the exact wording we store. */
export function ConsentCheckbox({
  name,
  wording,
  checked,
  onChange,
}: {
  name: string;
  wording: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="grid cursor-pointer grid-cols-[24px_1fr] items-start gap-3 text-[15px] leading-snug">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        className="mt-0.5 size-[22px] accent-blue"
      />
      <span>{wording}</span>
    </label>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 text-[15px] font-semibold">
      {children}
    </p>
  );
}

export function GoodToKnow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-1 rounded-[var(--radius-card)] border border-sand-line bg-sand px-4 py-3.5">
      <p className="font-display text-[15px] font-bold">Good to know</p>
      <p className="text-[15px]">{children}</p>
    </div>
  );
}
