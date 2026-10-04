import { Hero } from "@/components/home/Hero";
import { ServicePicker } from "@/components/home/ServicePicker";
import { Section } from "@/components/ui/Section";
import {
  AreaSection,
  ChecksSection,
  Faq,
  FinalCta,
  GuidesTeaser,
  HowItWorks,
  WhatHappensNext,
} from "@/components/home/HomeSections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Section
        id="services"
        eyebrow="Start here"
        title="What are you looking to improve?"
        intro="Choose a service and we'll ask a few quick questions about your home."
      >
        <ServicePicker />
      </Section>
      <HowItWorks />
      <ChecksSection />
      <WhatHappensNext />
      <GuidesTeaser />
      <AreaSection />
      <Faq />
      <FinalCta />
    </>
  );
}
