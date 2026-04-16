"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { use } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MonitorDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();

  const tabs = [
    { label: "Overview", href: `/dashboard/${id}` },
    { label: "Heartbeats", href: `/dashboard/${id}/heartbeats` },
    { label: "Chart", href: `/dashboard/${id}/chart` },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 pt-4">
        <Tabs value={pathname}>
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.href} value={tab.href} asChild>
                <Link href={tab.href}>{tab.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}
