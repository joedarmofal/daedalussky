import type { ReactElement } from "react";

import { OrgSectionPlaceholder } from "@/components/org/OrgSectionPlaceholder";

export const dynamic = "force-dynamic";

export default async function ClientsPage(): Promise<ReactElement> {
  return (
    <OrgSectionPlaceholder
      currentPath="/clients"
      title="Clients"
      subtitle="Partner organizations across healthcare and public safety ecosystems."
      comingSoon={[
        "Healthcare facilities and referral contacts",
        "Fire / EMS / Law Enforcement / SAR / Ski Patrol / Military partner records",
        "Service-level agreements and callout protocols",
      ]}
    />
  );
}
