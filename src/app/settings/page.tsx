import type { ReactElement } from "react";

import { SettingsPage } from "@/components/settings/SettingsPage";

export const dynamic = "force-dynamic";

export default function SettingsRoute(): ReactElement {
  return <SettingsPage />;
}
