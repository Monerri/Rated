import { ButtonLink } from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/Icon";
import { EvidenceCard } from "@/components/home/EvidenceCard";
import { demoSpecialist } from "@/data/specialists";
import { primaryRegion } from "@/config/regions";
import { photos } from "@/config/photos";
import { Photo } from "@/components/ui/Photo";

export function Hero() {
  return (
    <section aria-labelledby="hero-heading">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pb-24">
        <div className="grid max-w-xl gap-5">
          <h1 id="hero-heading" className="text-[42px] font-medium leading-[1.04] tracking-[-0.025em] sm:text-[54px] lg:text-[68px]">
            Make your home better. <em className="italic text-blue">With the right people.</em>
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

        {photos.homeHero.src ? (
          <div className="mx-auto w-full max-w-lg lg:max-w-none">
            <Photo photo={photos.homeHero} priority />
            <div className="relative -mt-24 ml-3 w-[88%] max-w-sm sm:-mt-36 lg:-ml-8">
              <EvidenceCard specialist={demoSpecialist} />
              <p className="mt-2 text-[13px] text-muted">
                An example of the checks we show for every specialist. This company is fictional.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <EvidenceCard specialist={demoSpecialist} />
            <p className="mt-3 text-center text-[13px] text-muted">
              An example of the checks we show for every specialist. This company is fictional.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
