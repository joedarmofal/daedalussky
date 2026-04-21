import Link from "next/link";

const ORG_NAV_ITEMS = [
  { href: "/", label: "Mission Control" },
  { href: "/members", label: "Members" },
  { href: "/debriefing", label: "Debriefing" },
  { href: "/quality", label: "Quality" },
  { href: "/schedule", label: "Schedule" },
  { href: "/pulse-check", label: "Pulse Check" },
  { href: "/education", label: "Education" },
  { href: "/clients", label: "Clients" },
] as const;

export function OrgPrimaryNav(props: { currentPath: string }) {
  return (
    <nav className="mt-3 flex flex-wrap gap-2">
      {ORG_NAV_ITEMS.map((item) => {
        const isActive = item.href === props.currentPath;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded border px-3 py-1.5 font-mono text-xs transition-colors ${
              isActive
                ? "border-accent/50 bg-accent/15 text-accent"
                : "border-border text-muted hover:border-accent/40 hover:text-accent"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
