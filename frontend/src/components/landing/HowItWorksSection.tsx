"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-how-heading]", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      gsap.from("[data-how-card]", {
        y: 60,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "[data-how-card]",
          start: "top 80%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="w-full px-4 py-24 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div data-how-heading className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-zinc-900 dark:text-zinc-100 tracking-tighter mb-4">
            How ARIA works
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            From raw query to verified report in three autonomous steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Step 1: Define Research */}
          <div
            data-how-card
            className="relative min-h-[380px] overflow-hidden rounded-3xl liquid-glass-card p-6 hover-lift"
          >
            <span className="absolute top-6 right-6 text-xs text-zinc-500 dark:text-zinc-500 font-mono">
              01
            </span>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/30 flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-blue-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <h3 className="text-xl text-zinc-900 dark:text-zinc-100 font-medium tracking-tight">
                Define Research
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                Describe your research topic in natural language — ARIA handles
                the rest.
              </p>
            </div>

            {/* Orbit visual */}
            <div className="absolute bottom-8 right-8 w-32 h-32">
              <div className="absolute inset-0 rounded-full ring-1 ring-black/5 dark:ring-white/5" />
              <div className="absolute inset-4 rounded-full ring-1 ring-black/5 dark:ring-white/5" />
              <div
                className="absolute inset-0"
                style={{ animation: "orbit 8s linear infinite" }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
              </div>
              <div
                className="absolute inset-0"
                style={{ animation: "orbit-reverse 12s linear infinite" }}
              >
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
              </div>
            </div>
          </div>

          {/* Step 2: Agents Execute */}
          <div
            data-how-card
            className="relative min-h-[380px] overflow-hidden rounded-3xl liquid-glass-card p-6 hover-lift"
          >
            <span className="absolute top-6 right-6 text-xs text-zinc-500 dark:text-zinc-500 font-mono">
              02
            </span>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30 flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
                </svg>
              </div>
              <h3 className="text-xl text-zinc-900 dark:text-zinc-100 font-medium tracking-tight">
                Agents Execute
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                Researcher, Analyst, Grader, and Writer agents work in parallel
                pipeline.
              </p>
            </div>

            {/* Steps list */}
            <div className="mt-8 space-y-1.5">
              {[
                { label: "Web search & scraping", delay: "0s" },
                { label: "Vector retrieval", delay: "3s" },
                { label: "Relevance grading", delay: "6s" },
              ].map((step, i) => (
                <div
                  key={step.label}
                  className="animate-step-cycle flex items-center gap-3 px-3 py-2 rounded-lg ring-1 ring-black/5 dark:ring-white/10 bg-white/80 dark:bg-zinc-900/80 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300"
                  style={{ animationDelay: step.delay }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
                  {step.label}
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Verified Report */}
          <div
            data-how-card
            className="relative min-h-[380px] overflow-hidden rounded-3xl liquid-glass-card p-6 hover-lift"
          >
            <span className="absolute top-6 right-6 text-xs text-zinc-500 dark:text-zinc-500 font-mono">
              03
            </span>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/30 flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-violet-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="text-xl text-zinc-900 dark:text-zinc-100 font-medium tracking-tight">
                Verified Report
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                Get a comprehensive report with citations, executive summary,
                and key insights.
              </p>
            </div>

            {/* Graph */}
            <div className="absolute bottom-6 left-6 right-6">
              <svg
                viewBox="0 0 260 80"
                className="w-full h-auto"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="lineGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,70 Q30,65 65,45 T130,30 T195,15 T260,10"
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 600,
                    animation: "drawWave 4s ease-out infinite",
                  }}
                />
              </svg>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-500">
                  Report Quality
                </span>
                <span
                  className="text-xs text-emerald-300 font-mono"
                  style={{ animation: "fadeIn 1s ease-out 2s both" }}
                >
                  98.2%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
