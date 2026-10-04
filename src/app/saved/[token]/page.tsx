import type { Metadata } from "next";
import { SavedProgress } from "@/components/funnel/SavedProgress";

export const metadata: Metadata = {
  title: "Your saved answers",
  robots: { index: false, follow: false },
};

/** Opened from the link in the saved-progress email. */
export default async function SavedProgressPage({ params }: PageProps<"/saved/[token]">) {
  const { token } = await params;
  return <SavedProgress token={token} />;
}
