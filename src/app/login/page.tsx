import type { ReactElement } from "react";

import { FirebaseLoginForm } from "./FirebaseLoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage(): ReactElement {
  return <FirebaseLoginForm />;
}
