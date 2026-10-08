import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-2xl justify-items-start gap-4 px-4 py-20 sm:px-6">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="text-[32px] font-bold leading-tight">We can&apos;t find that page</h1>
      <p className="text-lg text-muted">
        It may have moved, or it may not be built yet. This site is still being developed.
      </p>
      <ButtonLink href="/">Back to the homepage</ButtonLink>
    </div>
  );
}
