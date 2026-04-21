import type { ReactElement } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OrgSectionPlaceholder } from "@/components/org/OrgSectionPlaceholder";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function EducationPage(): Promise<ReactElement> {
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
