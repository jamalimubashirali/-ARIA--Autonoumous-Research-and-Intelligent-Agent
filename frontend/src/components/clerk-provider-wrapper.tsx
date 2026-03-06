"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ClerkProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ClerkProvider
      appearance={{
        baseTheme: mounted && resolvedTheme === "dark" ? dark : undefined,
        variables: {
          colorPrimary: "#06b6d4", // Cyan 500
          borderRadius: "0.75rem",
          colorBackground:
            mounted && resolvedTheme === "dark" ? "transparent" : "#ffffff",
          colorText:
            mounted && resolvedTheme === "dark" ? "#e4e4e7" : "#09090b",
        },
        elements: {
          card: "bg-background/95 backdrop-blur-3xl border border-border shadow-md",
          formButtonPrimary:
            "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold",
          footerActionLink: "text-primary hover:text-primary/90",
          userButtonPopoverCard:
            "bg-background/95 backdrop-blur-3xl border border-border shadow-md min-w-[280px]",
          userButtonPopoverActionButton:
            "text-foreground hover:bg-muted focus:bg-muted",
          userButtonPopoverActionButtonText: "text-foreground",
          userButtonPopoverActionButtonIcon: "text-muted-foreground",
          userButtonPopoverFooter: "hidden",
          userPreviewMainIdentifier: "text-foreground font-semibold",
          userPreviewSecondaryIdentifier: "text-muted-foreground",
          userButtonAvatarBox:
            "!w-10 !h-10 ring-2 ring-primary/20 hover:ring-primary/40 transition-all",
          userPreviewAvatarBox: "!w-12 !h-12",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
