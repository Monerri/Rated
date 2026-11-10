import { launch } from "@/config/launch";

/**
 * Shown to homeowners while we're still onboarding specialists, so nobody is
 * surprised if we can't recommend anyone for their area yet.
 */
export function OnboardingNotice() {
  if (!launch.onboardingPhase) return null;
  return (
    <p className="flex gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-[15px]">
      <span aria-hidden="true" className="font-display font-bold text-blue">
        i
      </span>
      <span>
        <strong className="font-semibold">We&apos;ve just opened.</strong> We&apos;re still welcoming and checking
        specialists, so for some services and areas we may not have anyone to recommend yet. If so, we&apos;ll tell you
        straight away, and you can ask us to email you when we do.
      </span>
    </p>
  );
}
