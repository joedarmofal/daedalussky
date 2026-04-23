import type { ReactElement } from "react";

import { LandingExperience } from "@/components/home/LandingExperience";

export const dynamic = "force-dynamic";

export default function Home(): ReactElement {
  return <LandingExperience />;
}
