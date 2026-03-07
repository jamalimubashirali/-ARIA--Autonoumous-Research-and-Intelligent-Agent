"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate heading
      gsap.from("[data-feat-heading]", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
        },
      });

      // Stagger cards
      gsap.from("[data-feat-card]", {
        y: 60,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 65%",
          toggleActions: "play none none none",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="w-full px-4 py-24 relative z-10"
    >
      <div className="max-w-7xl mx-auto">
        <div data-feat-heading className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-zinc-900 dark:text-zinc-100 tracking-tighter mb-4">
            A symphony of agents
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            ARIA doesn&apos;t just query an LLM. It plans, retrieves, grades,
            rewrites, and verifies.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Research Pipeline */}
          <div
            data-feat-card
            className="md:col-span-2 min-h-[340px] relative overflow-hidden rounded-3xl liquid-glass-card p-6 hover-lift group"
          >
            <div className="relative z-10">
              <span className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-widest font-medium">
                Research Pipeline
              </span>
              <h3 className="text-2xl text-zinc-900 dark:text-zinc-100 font-medium mt-2 tracking-tight">
                Tireless Retrieval & Analysis
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-md">
                Our agents crawl the live web and internal vectors
                simultaneously — gathering raw context without human limits.
              </p>
            </div>
            {/* Animated code snippet */}
            <div className="absolute bottom-6 right-6 w-[320px] rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 ring-1 ring-black/5 dark:ring-white/5 overflow-hidden opacity-90">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50/50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <div className="w-2 h-2 rounded-full bg-red-500/40" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/40" />
                <div className="w-2 h-2 rounded-full bg-green-500/40" />
                <span className="ml-2 text-[10px] text-zinc-500 dark:text-zinc-500">
                  research_agent.py
                </span>
              </div>
              <div className="p-3 font-mono text-[11px] leading-relaxed">
                <div className="anim-cycle-1">
                  <span className="text-pink-600 dark:text-pink-400">
                    async def{" "}
                  </span>
                  <span className="text-blue-600 dark:text-blue-300">
                    gather_sources
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    (query):
                  </span>
                </div>
                <div className="anim-cycle-2">
                  <span className="text-zinc-600 dark:text-zinc-400"> </span>
                  <span className="text-cyan-600 dark:text-cyan-300">
                    web_results
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400"> = </span>
                  <span className="text-amber-600 dark:text-yellow-300">
                    await
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {" "}
                    crawl(query)
                  </span>
                </div>
                <div className="anim-cycle-typing flex items-center gap-1 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-600/70 dark:text-emerald-300/70">
                    Generating report...
                  </span>
                </div>
                <div className="anim-cycle-3">
                  <span className="text-zinc-600 dark:text-zinc-400"> </span>
                  <span className="text-pink-600 dark:text-pink-400">
                    return{" "}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-300">
                    verified_report
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Corrective RAG */}
          <div
            data-feat-card
            className="min-h-[340px] relative overflow-hidden rounded-3xl liquid-glass-card p-6 hover-lift group"
          >
            <div className="relative z-10">
              <span className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-widest font-medium">
                Corrective RAG
              </span>
              <h3 className="text-2xl text-zinc-900 dark:text-zinc-100 font-medium mt-2 tracking-tight">
                Self-Healing Grading
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                The Analyst grades every chunk. Irrelevant findings? It rewrites
                the query and tries again.
              </p>
            </div>
            {/* Animated theme rows */}
            <div className="mt-8 space-y-2">
              {[
                {
                  label: "Relevance Grade",
                  color: "bg-emerald-400",
                  active: true,
                },
                {
                  label: "Source Reliability",
                  color: "bg-cyan-400",
                  active: false,
                },
                {
                  label: "Citation Accuracy",
                  color: "bg-violet-400",
                  active: false,
                },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ring-1 ${i === 0 ? "ring-emerald-500/30 bg-emerald-500/10" : "ring-black/5 dark:ring-white/5 bg-white/50 dark:bg-zinc-900/80"}`}
                >
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-zinc-800 dark:text-zinc-200">
                    {item.label}
                  </span>
                  {item.active && (
                    <span className="ml-auto text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Report Customization */}
          <div
            data-feat-card
            className="min-h-[280px] relative overflow-hidden rounded-3xl liquid-glass-card p-6 hover-lift group"
          >
            <div className="relative z-10">
              <span className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-widest font-medium">
                Report Engine
              </span>
              <h3 className="text-2xl text-zinc-900 dark:text-zinc-100 font-medium mt-2 tracking-tight">
                Custom Formatting
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                Executive briefs, deep-dives, competitive analyses — choose your
                output format and depth.
              </p>
            </div>
          </div>

          {/* Card 4: Team Collaboration */}
          <div
            data-feat-card
            className="min-h-[280px] relative overflow-hidden rounded-3xl liquid-glass-card p-6 hover-lift group"
          >
            <div className="relative z-10">
              <span className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-widest font-medium">
                Collaboration
              </span>
              <h3 className="text-2xl text-zinc-900 dark:text-zinc-100 font-medium mt-2 tracking-tight">
                Team Research
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                Share research sessions, annotate reports, and build
                institutional knowledge together.
              </p>
            </div>
            {/* Comment animation */}
            <div className="absolute bottom-6 left-6 right-6 space-y-2">
              <div className="anim-comment flex items-center gap-2 bg-zinc-50/80 dark:bg-zinc-900/80 ring-1 ring-black/5 dark:ring-white/5 rounded-xl p-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-zinc-900 dark:text-white font-bold shrink-0">
                  A
                </div>
                <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
                  Can we cross-reference this with the Q4 report?
                </p>
              </div>
              <div className="anim-response flex items-center gap-2 bg-zinc-50/80 dark:bg-zinc-900/80 ring-1 ring-black/5 dark:ring-white/5 rounded-xl p-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-zinc-900 dark:text-white font-bold shrink-0">
                  S
                </div>
                <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
                  Done — added 3 new citations from Q4 data.
                </p>
              </div>
            </div>
          </div>

          {/* Card 5: Domain Templates */}
          <div
            data-feat-card
            className="min-h-[280px] relative overflow-hidden rounded-3xl liquid-glass-card p-6 hover-lift group"
          >
            <div className="relative z-10">
              <span className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-widest font-medium">
                Templates
              </span>
              <h3 className="text-2xl text-zinc-900 dark:text-zinc-100 font-medium mt-2 tracking-tight">
                Domain Templates
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                Healthcare, Finance, Technology, Legal — pre-configured research
                workflows for every industry.
              </p>
            </div>
            <div className="absolute bottom-6 left-6 right-6 space-y-1.5">
              <div className="anim-hover-1 px-3 py-2 rounded-lg ring-1 ring-black/5 dark:ring-white/10 bg-white/80 dark:bg-zinc-900/80 text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" /> FinTech
                Regulatory Analysis
              </div>
              <div className="anim-hover-2 px-3 py-2 rounded-lg ring-1 ring-black/5 dark:ring-white/10 bg-white/80 dark:bg-zinc-900/80 text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />{" "}
                Healthcare Market Scan
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
