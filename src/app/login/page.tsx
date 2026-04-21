import type { ReactElement } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "./LoginForm";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage(): Promise<ReactElement> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/");
  }
  return <LoginForm />;
}
