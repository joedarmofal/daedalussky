import type { ReactElement } from "react";

import { OrgSectionPlaceholder } from "@/components/org/OrgSectionPlaceholder";

export const dynamic = "force-dynamic";

export default async function EducationPage(): Promise<ReactElement> {
  return (
    <OrgSectionPlaceholder
      currentPath="/education"
      title="Education"
      subtitle="Training, continuing education, and readiness management."
      comingSoon={[
        "Training plans and annual requirements",
        "Simulation and competency tracking",
        "Certification expiry learning prompts",
      ]}
    />
  );
}
