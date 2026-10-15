import type { Metadata } from "next";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";

export const metadata: Metadata = {
  title: "How did it go?",
  robots: { index: false, follow: false },
};

/** Opened from the one feedback email we send about two weeks after an introduction. */
export default async function FeedbackPage({ params }: PageProps<"/feedback/[token]">) {
  const { token } = await params;
  return (
    <div className="mx-auto grid max-w-2xl gap-6 px-4 py-12 sm:px-6 md:py-16">
      <FeedbackForm token={token} />
    </div>
  );
}
