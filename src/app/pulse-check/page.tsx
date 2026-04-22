import type { ReactElement } from "react";

import { PulseCheckManager } from "@/components/pulse-check/PulseCheckManager";

export const dynamic = "force-dynamic";

export default async function PulseCheckPage(): Promise<ReactElement> {
  return <PulseCheckManager />;
}
