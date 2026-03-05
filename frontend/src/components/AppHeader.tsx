import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-2xl">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="font-semibold text-white sm:inline-block tracking-tight">
              ARIA
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
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
