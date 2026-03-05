import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.08)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(6,182,212,0.05)_0%,_transparent_50%)]" />

      {/* Logo */}
      <Link
        href="/"
        className="relative z-10 mb-8 text-2xl font-bold text-white tracking-tight"
      >
        ARIA
      </Link>

      <SignUp
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
            rootBox: "mx-auto relative z-10",
            card: "bg-zinc-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-cyan-500/5",
            headerTitle: "text-zinc-100",
            headerSubtitle: "text-zinc-500",
            socialButtonsBlockButton:
              "bg-zinc-800 border-white/10 text-zinc-200 hover:bg-zinc-700",
            socialButtonsBlockButtonText: "text-zinc-200",
            formFieldLabel: "text-zinc-400",
            formFieldInput:
              "bg-zinc-800/60 border-white/10 text-zinc-100 focus:ring-cyan-500/30 focus:border-cyan-500/40",
            formButtonPrimary:
              "bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold",
            footerActionLink: "text-cyan-400 hover:text-cyan-300",
            identityPreviewEditButton: "text-cyan-400",
            formFieldAction: "text-cyan-400",
            dividerLine: "bg-white/10",
            dividerText: "text-zinc-600",
            footer: "bg-transparent",
          },
        }}
      />
    </div>
  );
}
