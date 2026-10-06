"use client";

import type { Service } from "@/lib/types";
import { InterestForm } from "@/components/interest/InterestForm";

/**
 * For people the questionnaire can't help yet (outside our area, or no
 * specialist vetted for their area). Registers interest only.
 */
export function NotifyMe({
  headingRef,
  service,
  postcode,
  postcodeArea = null,
  title,
  body,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  service: Service;
  postcode: string | null;
  postcodeArea?: string | null;
  title: string;
  body: string;
}) {
  return (
    <InterestForm
      service={service}
      title={title}
      intro={body}
      postcode={postcode}
      postcodeArea={postcodeArea}
      headingRef={headingRef}
      headingLevel="h1"
    />
  );
}
