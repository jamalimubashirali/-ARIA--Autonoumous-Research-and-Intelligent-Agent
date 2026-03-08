import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-semibold whitespace-nowrap outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 group relative overflow-hidden cursor-pointer transition-all duration-[900ms] ease-[cubic-bezier(0.15,0.83,0.66,1)] hover:-translate-y-[2px]",
  {
    variants: {
      variant: {
        default:
          "border border-cyan-500/20 dark:border-cyan-400/20 bg-cyan-500/10 dark:bg-cyan-400/10 text-cyan-700 dark:text-cyan-300 hover:text-white dark:hover:text-zinc-950 hover:bg-cyan-500 dark:hover:bg-cyan-400 shadow-sm",
        destructive:
          "border border-red-500/20 dark:border-red-400/20 bg-red-500/10 dark:bg-red-400/10 text-red-700 dark:text-red-300 hover:text-white dark:hover:text-zinc-950 hover:bg-red-500 dark:hover:bg-red-400 shadow-sm",
        outline:
          "border border-zinc-200 bg-transparent shadow-xs hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:text-zinc-300",
        secondary:
          "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
        ghost:
          "hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-zinc-50",
        link: "text-cyan-600 dark:text-cyan-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2.5",
        xs: "h-6 px-2 text-xs",
        sm: "h-8 px-4",
        lg: "h-12 px-8 text-base",
        icon: "size-10",
        "icon-xs": "size-6",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  if (asChild) {
    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2 transition-all duration-500 ease-out group-hover:-translate-y-full group-hover:opacity-0">
        {children}
      </span>
      <span className="absolute inset-0 z-10 flex items-center justify-center gap-2 font-semibold opacity-0 transition-all duration-500 ease-out translate-y-full group-hover:translate-y-0 group-hover:opacity-100">
        {children}
      </span>

      {variant === "default" && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 h-[1px] w-[70%] -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent opacity-70 blur-[2px]"
        />
      )}

      {(variant === "default" || variant === "destructive") && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-t from-white/15 via-white/10 to-transparent mix-blend-overlay"
        />
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
