import { redirect } from "next/navigation";

type LoginLegacyProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") {
    return v;
  }
  if (Array.isArray(v) && typeof v[0] === "string") {
    return v[0];
  }
  return undefined;
}

export const dynamic = "force-dynamic";

export default async function LoginLegacyPage({ searchParams }: LoginLegacyProps) {
  const sp = searchParams ? await searchParams : {};
  const r = firstString(sp.redirect);
  const qs = new URLSearchParams();
  if (r) {
    qs.set("redirect", r);
  }
  redirect(qs.toString() ? `/?${qs.toString()}` : "/");
}
