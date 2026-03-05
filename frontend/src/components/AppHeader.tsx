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
                avatarBox: "w-9 h-9 ring-2 ring-cyan-500/20",
                userButtonPopoverCard:
                  "bg-zinc-900 border border-white/10 shadow-2xl !min-w-[280px]",
                userButtonPopoverActionButton:
                  "text-zinc-300 hover:text-white hover:bg-white/5 !py-3",
                userButtonPopoverActionButtonText: "text-zinc-300 !text-sm",
                userButtonPopoverActionButtonIcon: "!w-5 !h-5 text-zinc-500",
                userPreviewMainIdentifier:
                  "text-zinc-100 !text-base !font-semibold",
                userPreviewSecondaryIdentifier: "text-zinc-500 !text-sm",
                userPreviewAvatarBox: "!w-12 !h-12",
                userButtonPopoverFooter: "hidden",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
