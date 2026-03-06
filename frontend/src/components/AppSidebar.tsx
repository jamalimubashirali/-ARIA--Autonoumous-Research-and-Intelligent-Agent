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
    label: "Settings & Billing",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-card dark:bg-black/20 backdrop-blur-3xl border-r border-border dark:border-white/10 dark:shadow-[inset_-1px_0_0_rgba(255,255,255,0.05)] w-64 shrink-0">
      <div className="px-3 py-6 flex-1">
        <h2 className="mb-4 px-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Menu
        </h2>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full items-center font-medium cursor-pointer rounded-xl transition-all duration-200",
                pathname === route.href
                  ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:text-zinc-200 dark:hover:bg-white/5",
              )}
            >
              <route.icon
                className={cn(
                  "h-4 w-4 mr-3",
                  pathname === route.href
                    ? "text-cyan-600 dark:text-cyan-400"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {route.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
