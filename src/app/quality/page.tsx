import type { ReactElement } from "react";

import { OrgSectionPlaceholder } from "@/components/org/OrgSectionPlaceholder";

export const dynamic = "force-dynamic";

export default async function QualityPage(): Promise<ReactElement> {
  return (
    <OrgSectionPlaceholder
      currentPath="/quality"
      title="Quality"
      subtitle="Safety, QA/QI, and quality outcomes for flight operations."
      comingSoon={[
        "QA event log and trend analytics",
        "Safety event review board workflow",
        "Compliance and accreditation scorecards",
      ]}
    />
  );
}
