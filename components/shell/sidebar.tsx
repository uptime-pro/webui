"use client";

import {
  Activity,
  Bell,
  CalendarClock,
  Globe,
  Key,
  Layers,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/monitors/add", label: "Add Monitor", icon: Plus },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/status-pages", label: "Status Pages", icon: Globe },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/maintenance", label: "Maintenance", icon: CalendarClock },
  {
    href: "/settings/general",
    label: "Settings",
    icon: Settings,
    matchPrefix: "/settings",
  },
  {
    href: "/settings/api-keys",
    label: "API Keys",
    icon: Key,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-background">
      <div className="flex h-14 items-center gap-2 px-4">
        <Activity className="h-5 w-5 text-primary" />
        <span className="font-semibold">Uptime Pro</span>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map(({ href, label, icon: Icon, matchPrefix }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              (matchPrefix
                ? pathname.startsWith(matchPrefix)
                : pathname === href) && "bg-accent text-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
        {user?.role === "ADMIN" && (
          <>
            <Separator className="my-1" />
            <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admin
            </p>
            <Link
              href="/admin/users"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname.startsWith("/admin/users") &&
                  "bg-accent text-accent-foreground",
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              Users
            </Link>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/admin/queues`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Layers className="h-4 w-4" />
              Queue Inspector
            </a>
          </>
        )}
      </nav>
      <Separator />
      <div className="p-3 space-y-2">
        {user && (
          <div className="px-2 py-1">
            <p className="text-sm font-medium truncate">{user.username}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.role}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
