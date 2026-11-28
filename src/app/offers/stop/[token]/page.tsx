import type { Metadata } from "next";
import { StopOffers } from "@/components/suppliers/StopOffers";

export const metadata: Metadata = {
  title: "Stop offers",
  robots: { index: false, follow: false },
};

/** Opened from the link in offer emails to specialists, such as the referral invite. */
export default async function StopOffersPage({ params }: PageProps<"/offers/stop/[token]">) {
  const { token } = await params;
  return <StopOffers token={token} />;
}
