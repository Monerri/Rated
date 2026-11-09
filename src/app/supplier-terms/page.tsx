import type { Metadata } from "next";
import { site } from "@/config/site";
import { LegalPage } from "@/components/pages/LegalPage";

export const metadata: Metadata = {
  title: "Specialist terms",
  description: `The terms for specialists who receive introductions through ${site.name}, including prepaid credit.`,
};

export default function SupplierTermsPage() {
  return <LegalPage slug="supplier-terms" />;
}
