import { getCatalogueLists } from "@/lib/catalogue";
import { RegisterInterest } from "@/components/interest/RegisterInterest";
import { LiveServiceCards } from "@/components/home/ServiceCards";
import { ServiceSearch } from "@/components/home/ServiceSearch";
import { OnboardingNotice } from "@/components/home/OnboardingNotice";

/**
 * Live services start the questionnaire. Coming-soon services open a
 * register-interest form. Both lists come from the live catalogue. With
 * `search`, a box above the cards filters them as you type.
 */
export async function ServicePicker({ search = false }: { search?: boolean }) {
  const { live: liveServices, comingSoon: comingSoonServices } = await getCatalogueLists();
  if (search) {
    return (
      <div className="grid gap-6">
        <OnboardingNotice />
        <ServiceSearch live={liveServices} comingSoon={comingSoonServices} />
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      <OnboardingNotice />
      <LiveServiceCards services={liveServices} />
      <RegisterInterest services={comingSoonServices} />
    </div>
  );
}
