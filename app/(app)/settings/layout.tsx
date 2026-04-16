"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sections = [
  { href: "/settings/general", label: "General" },
  { href: "/settings/monitoring", label: "Monitoring" },
  { href: "/settings/api-keys", label: "API Keys" },
  { href: "/settings/reports", label: "Reports" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex gap-8 h-full">
      <nav className="w-44 shrink-0 space-y-1">
        <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Settings
        </p>
        {sections.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              pathname === href
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
