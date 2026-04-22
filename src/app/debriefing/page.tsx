import type { ReactElement } from "react";

import { DebriefingModules } from "@/components/debriefing/DebriefingModules";

export const dynamic = "force-dynamic";

export default async function DebriefingPage(): Promise<ReactElement> {
  return <DebriefingModules />;
}
