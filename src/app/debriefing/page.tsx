import type { ReactElement } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DebriefingModules } from "@/components/debriefing/DebriefingModules";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function DebriefingPage(): Promise<ReactElement> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <DebriefingModules />;
}
