import type { ReactElement } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OrgSectionPlaceholder } from "@/components/org/OrgSectionPlaceholder";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function ClientsPage(): Promise<ReactElement> {
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
