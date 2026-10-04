import type { Metadata } from "next";
import { ServicePicker } from "@/components/home/ServicePicker";
import { knownPostcodeArea } from "@/config/regions";

export const metadata: Metadata = {
  title: "Find a specialist",
  description: "Choose what you're looking to improve and answer a few quick questions about your home.",
};

/** First screen of the funnel. Carries a postcode area chosen on the homepage through to the questionnaire. */
export default async function FindASpecialistPage({ searchParams }: PageProps<"/find-a-specialist">) {
  const area = knownPostcodeArea((await searchParams).area);
  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-4 py-10 sm:px-6 md:py-16">
      <div className="grid max-w-2xl gap-3">
        <h1 className="text-[32px] font-bold leading-tight md:text-[40px]">What are you looking to improve?</h1>
        <p className="text-lg text-muted">Choose a service. It takes about two minutes, one question at a time.</p>
      </div>
      <ServicePicker area={area} />
    </div>
  );
}
