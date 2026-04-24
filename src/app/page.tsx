import type { ReactElement } from "react";

import { FirebaseLoginForm } from "@/app/login/FirebaseLoginForm";

export const dynamic = "force-dynamic";

export default function Home(): ReactElement {
  return <FirebaseLoginForm />;
}
