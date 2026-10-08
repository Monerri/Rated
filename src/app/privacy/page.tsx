import type { Metadata } from "next";
import { LegalPage } from "@/components/pages/LegalPage";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How we collect, use, share and protect your personal information.",
};

export default function PrivacyPage() {
  return <LegalPage slug="privacy" />;
}
