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
    <div className="flex flex-col h-full bg-zinc-950/60 backdrop-blur-xl border-r border-white/5 w-64 shrink-0">
      <div className="px-3 py-6 flex-1">
        <h2 className="mb-4 px-4 text-xs font-medium uppercase tracking-widest text-zinc-500">
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
                  ? "bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5",
              )}
            >
              <route.icon
                className={cn(
                  "h-4 w-4 mr-3",
                  pathname === route.href
                    ? "text-cyan-400"
                    : "text-zinc-600 group-hover:text-zinc-400",
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
