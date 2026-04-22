import type { ReactElement } from "react";

import { ScheduleBoard } from "@/components/schedule/ScheduleBoard";

export const dynamic = "force-dynamic";

export default async function SchedulePage(): Promise<ReactElement> {
  return <ScheduleBoard />;
}
