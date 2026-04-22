import type { ReactElement } from "react";

import { MembersManager } from "@/components/members/MembersManager";

export const dynamic = "force-dynamic";

export default async function MembersPage(): Promise<ReactElement> {
  return <MembersManager />;
}
