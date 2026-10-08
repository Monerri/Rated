import type { Metadata } from "next";
import { Unsubscribe } from "@/components/interest/Unsubscribe";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

/** Opened from the link in register-interest emails. */
export default async function UnsubscribePage({ params }: PageProps<"/unsubscribe/[token]">) {
  const { token } = await params;
  return <Unsubscribe token={token} />;
}
