import type { Metadata } from "next";
import { LegalPage } from "@/components/pages/LegalPage";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms that apply when you use our website and service.",
};

export default function TermsPage() {
  return <LegalPage slug="terms" />;
}
