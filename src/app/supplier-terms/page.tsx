import type { Metadata } from "next";
import { LegalPage } from "@/components/pages/LegalPage";

export const metadata: Metadata = {
  title: "Specialist terms",
  description: "The terms for specialists who receive introductions through Vetted North, including prepaid credit.",
};

export default function SupplierTermsPage() {
  return <LegalPage slug="supplier-terms" />;
}
