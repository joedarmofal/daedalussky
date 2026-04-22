import type { ReactElement } from "react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage(): Promise<ReactElement> {
  redirect("/");
}
