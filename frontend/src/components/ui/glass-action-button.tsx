import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  glowColor?:
    | "cyan"
    | "emerald"
    | "blue"
    | "indigo"
    | "purple"
    | "rose"
    | "amber";
}

const colorMap = {
  cyan: "via-cyan-400/70 group-hover:via-cyan-400",
  emerald: "via-emerald-400/70 group-hover:via-emerald-400",
  blue: "via-blue-400/70 group-hover:via-blue-400",
  indigo: "via-indigo-400/70 group-hover:via-indigo-400",
  purple: "via-purple-400/70 group-hover:via-purple-400",
  rose: "via-rose-400/70 group-hover:via-rose-400",
  amber: "via-amber-400/70 group-hover:via-amber-400",
};

export const GlassActionButton = React.forwardRef<
  HTMLButtonElement,
  GlassActionButtonProps
>(({ className, glowColor = "cyan", children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group inline-flex cursor-pointer overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.15,0.83,0.66,1)] hover:-translate-y-[2px] text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl relative items-center justify-center disabled:opacity-50 disabled:pointer-events-none active:scale-95",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-0 left-1/2 h-[1px] w-[70%] -translate-x-1/2 rounded-full opacity-70 blur-[2px] transition-all duration-500 bg-gradient-to-r from-transparent to-transparent group-hover:w-[90%]",
          colorMap[glowColor],
        )}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-xl pointer-events-none bg-gradient-to-t from-black/5 via-black/5 dark:from-white/15 dark:via-white/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500"
      />

      {/* Content wrapper for relative positioning above absolute borders */}
      <span className="relative z-10 flex items-center justify-center">
        {children}
      </span>
    </button>
  );
});
GlassActionButton.displayName = "GlassActionButton";
