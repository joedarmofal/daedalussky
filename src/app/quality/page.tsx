import type { ReactElement } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OrgSectionPlaceholder } from "@/components/org/OrgSectionPlaceholder";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function QualityPage(): Promise<ReactElement> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
