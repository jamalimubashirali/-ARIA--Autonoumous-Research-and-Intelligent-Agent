"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    name: "J. Amander",
    role: "CEO of Orix Agency",
    text: "DesignFlow was exactly what our startup needed. We launched our production website in days, not months — critical for early market entry.",
    avatar:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    name: "A. Levine",
    role: "CEO of Creative Agency",
    text: "The perfect balance of stunning aesthetics and real-world functionality. If you want high-impact results without the custom build hassle, this is it.",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    name: "G. Alexander",
    role: "CEO of Capital Agency",
    text: "As a digital artist, aesthetics are everything. The dark UI and subtle animations make my portfolio pop beautifully without distracting from my work.",
    avatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150&h=150",
  },
];

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-test-heading]", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="w-full px-4 py-24 relative z-10"
    >
      <div className="max-w-7xl mx-auto">
        <div data-test-heading className="mb-16">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-sm mb-8">
            <span className="text-sm font-medium text-zinc-600 dark:text-white/60">
              Testimonials
            </span>
          </div>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight mb-6">
            <span className="text-zinc-900 dark:text-white">
              Loved by designers,
            </span>
            <br />
            <span className="text-blue-400">trusted by teams</span>
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Real results from real teams — faster reviews, cleaner handoff, and
            a smoother path from idea to shipped UI.
          </p>
        </div>

        {/* The big container */}
        <div className="relative p-6 sm:p-8 rounded-[2rem] liquid-glass-card overflow-hidden">
          {/* Gradient masks for smooth marquee edges */}
          <div className="absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-white/80 dark:from-zinc-950/80 to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-white/80 dark:from-zinc-950/80 to-transparent pointer-events-none" />

          {/* Marquee */}
          <div
            className="flex gap-6 hover:[animation-play-state:paused]"
            style={{
              animation: "marquee-scroll 40s linear infinite",
              width: "fit-content",
            }}
          >
            {/* Duplicate for seamless loop */}
            {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
              <div
                key={`${t.name}-${i}`}
                className="flex-shrink-0 w-[400px] sm:w-[420px] p-8 rounded-3xl liquid-glass-card flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-8">
                  <span className="text-zinc-600 font-serif text-6xl leading-none h-8 mt-2">
                    &ldquo;
                  </span>
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-14 h-14 rounded-2xl object-cover grayscale opacity-80"
                  />
                </div>

                <p className="text-zinc-700 dark:text-zinc-300 text-lg leading-relaxed mb-12 font-medium">
                  {t.text}
                </p>

                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-1 font-medium">
                    {t.role}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 font-bold">
                    {t.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
