import type { ReactElement } from "react";

import { MissionControlDashboard } from "@/components/mission-control/MissionControlDashboard";

export const dynamic = "force-dynamic";

export default function MissionControlPage(): ReactElement {
  return <MissionControlDashboard />;
}
