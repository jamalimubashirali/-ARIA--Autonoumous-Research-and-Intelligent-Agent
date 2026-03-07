import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/20 dark:border-white/10 dark:bg-black/20 dark:backdrop-blur-3xl shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="font-semibold text-foreground dark:text-white sm:inline-block tracking-tight">
              ARIA
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <ThemeToggle />
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox:
                  "!w-10 !h-10 ring-2 ring-cyan-500/30 hover:ring-cyan-500/60 transition-all",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
