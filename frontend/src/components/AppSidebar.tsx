"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, LayoutDashboard, PlusCircle, Settings } from "lucide-react";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "New Research",
    icon: PlusCircle,
    href: "/dashboard/research",
  },
  {
    label: "Report History",
    icon: FileText,
    href: "/dashboard/history",
  },
  {
    label: "Settings & Billing",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-secondary/10 dark:bg-slate-900 border-r w-64 shrink-0">
      <div className="px-3 py-2 flex-1">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Menu</h2>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition",
                pathname === route.href
                  ? "bg-black/5 dark:bg-white/10"
                  : "text-zinc-500",
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3")} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
