import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARIA | Autonomous Research & Intelligent Agent",
  description:
    "Transform raw web data into executive-grade research reports in minutes. Powered by a relentless swarm of specialized AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#06b6d4",
          colorBackground: "#0a0a0f",
          colorText: "#e4e4e7",
          colorTextSecondary: "#71717a",
          colorInputBackground: "#18181b",
          colorInputText: "#e4e4e7",
          borderRadius: "0.75rem",
        },
        elements: {
          card: "bg-zinc-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl",
          formButtonPrimary:
            "bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold",
          footerActionLink: "text-cyan-400 hover:text-cyan-300",
          userButtonPopoverCard:
            "bg-zinc-900 border border-white/10 shadow-2xl",
          userButtonPopoverActionButton:
            "text-zinc-300 hover:text-white hover:bg-white/5",
          userButtonPopoverFooter: "hidden",
          userPreviewMainIdentifier: "text-zinc-100",
          userPreviewSecondaryIdentifier: "text-zinc-500",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
