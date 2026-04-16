"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  monitors: "Monitors",
  notifications: "Notifications",
  "status-pages": "Status Pages",
  tags: "Tags",
  maintenance: "Maintenance",
  settings: "Settings",
  "api-keys": "API Keys",
  admin: "Admin",
  users: "Users",
  add: "Add",
  new: "New",
  edit: "Edit",
  general: "General",
  monitoring: "Monitoring",
  reports: "Reports",
  incidents: "Incidents",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs: { label: string; href?: string }[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const isNumeric = /^\d+$/.test(seg);
    const label = ROUTE_LABELS[seg] ?? (isNumeric ? null : seg);
    if (!label) continue;

    const href = "/" + segments.slice(0, i + 1).join("/");
    crumbs.push({ label, href: i < segments.length - 1 ? href : undefined });
  }

  return crumbs;
}

export function Header() {
  const { user, logout } = useAuth();
  const crumbs = useBreadcrumbs();
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "?";

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />

      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          {crumbs.map((crumb, i) => (
            <BreadcrumbItem key={i}>
              {i < crumbs.length - 1 ? (
                <>
                  <BreadcrumbPage className="text-muted-foreground text-sm">
                    {crumb.label}
                  </BreadcrumbPage>
                  <BreadcrumbSeparator />
                </>
              ) : (
                <BreadcrumbPage className="text-sm font-medium">{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-full">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal py-2">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium leading-none">{user?.username}</p>
                <p className="text-xs text-muted-foreground leading-none">{user?.role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-destructive gap-2">
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
