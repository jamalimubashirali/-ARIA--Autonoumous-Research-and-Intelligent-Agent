import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="font-bold sm:inline-block">ARIA</span>
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
