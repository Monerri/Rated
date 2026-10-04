import { ButtonLink } from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/Icon";
import { EvidenceCard } from "@/components/home/EvidenceCard";
import { demoSpecialist } from "@/data/specialists";
import { primaryRegion } from "@/config/regions";

export function Hero() {
  return (
    <section aria-labelledby="hero-heading">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 md:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:pb-20">
        <div className="grid max-w-xl gap-5">
          <h1 id="hero-heading" className="text-[40px] font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-[56px]">
            Make your home better. <span className="text-blue">With the right people.</span>
          </h1>
          <p className="text-lg text-muted sm:text-xl">
            Tell us what you&apos;re looking to improve and we&apos;ll help match you with a trusted local specialist
            who&apos;s right for your needs.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/find-a-specialist" className="w-full sm:w-auto">
              Find a specialist <ArrowIcon />
            </ButtonLink>
            <ButtonLink href="#how-it-works" variant="secondary" className="w-full sm:w-auto">
              How it works
            </ButtonLink>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted">
            <span className="size-2 flex-none rounded-full bg-green" aria-hidden="true" />
            Free for homeowners · Currently covering {primaryRegion.name}
          </p>
        </div>

        <div className="mx-auto w-full max-w-md lg:max-w-none">
          <EvidenceCard specialist={demoSpecialist} />
          <p className="mt-3 text-center text-[13px] text-muted">
            An example of the checks we show for every specialist. This company is fictional.
          </p>
        </div>
      </div>
    </section>
  );
}
