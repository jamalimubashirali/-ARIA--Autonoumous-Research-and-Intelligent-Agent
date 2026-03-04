"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export function Navbar() {
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!navRef.current) return;
    gsap.from(navRef.current, {
      y: -40,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      delay: 0.2,
    });
  }, []);

  return (
    <nav className="fixed z-50 top-0 right-0 left-0">
      <div
        ref={navRef}
        className="fixed -translate-x-1/2 z-50 w-[min(100%-1rem,1100px)] pointer-events-none top-4 left-1/2"
      >
        <div className="pointer-events-auto border-white/15 border rounded-full ring-1 ring-white/15 pr-2 pl-6 relative shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-2xl bg-neutral-900/70">
          {/* Noise overlay */}
          <span
            aria-hidden="true"
            className="pointer-events-none bg-neutral-900/75 rounded-full absolute inset-0"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none opacity-[0.06] rounded-full absolute inset-0 noise-overlay"
          />
          <div className="relative">
            <div className="flex h-14 items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-8">
                <Link
                  href="/"
                  className="text-white font-semibold text-sm tracking-tight"
                >
                  ARIA
                </Link>
                <nav className="hidden md:flex items-center gap-6 text-sm">
                  <a
                    href="#features"
                    className="text-zinc-300 hover:text-white transition"
                  >
                    Features
                  </a>
                  <a
                    href="#pricing"
                    className="text-zinc-300 hover:text-white transition"
                  >
                    Pricing
                  </a>
                  <a
                    href="#testimonials"
                    className="text-zinc-300 hover:text-white transition"
                  >
                    Testimonials
                  </a>
                </nav>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Link href="/sign-in">
                  <button className="hidden sm:inline-flex group relative items-center justify-center min-w-[120px] px-5 py-2.5 text-sm font-semibold tracking-tight cursor-pointer overflow-hidden rounded-full border border-white/15 bg-white/10 text-neutral-100 transition-all duration-[900ms] ease-[cubic-bezier(0.15,0.83,0.66,1)] hover:-translate-y-[2px] hover:text-white">
                    <span className="relative z-10 transition-all duration-500 ease-out group-hover:translate-y-full group-hover:opacity-0">
                      Sign In
                    </span>
                    <span className="absolute inset-0 z-10 flex items-center justify-center font-medium opacity-0 transition-all duration-500 ease-out translate-y-full group-hover:translate-y-0 group-hover:opacity-100">
                      Sign In
                    </span>
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-1/2 h-[1px] w-[70%] -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent opacity-70 blur-[2px]"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-t from-white/15 via-white/10 to-transparent"
                    />
                  </button>
                </Link>
                {/* Mobile menu button */}
                <button className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/15 border border-white/20 text-zinc-100 hover:bg-white/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.6}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
