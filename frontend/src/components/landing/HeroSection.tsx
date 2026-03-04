"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const dashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Staggered entrance
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(headingRef.current, {
        y: 50,
        opacity: 0,
        duration: 1,
        delay: 0.3,
      })
        .from(subRef.current, { y: 40, opacity: 0, duration: 0.8 }, "-=0.5")
        .from(ctaRef.current, { y: 30, opacity: 0, duration: 0.8 }, "-=0.4");

      // Dashboard parallax on scroll
      if (dashRef.current) {
        gsap.from(dashRef.current, {
          y: 80,
          opacity: 0,
          scale: 0.95,
          filter: "blur(12px)",
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: dashRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex overflow-hidden pt-24 px-4 pb-0 relative items-center justify-center"
    >
      <div className="w-full max-w-7xl z-10 mx-auto relative top-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex text-xs text-zinc-400 bg-zinc-800/50 border border-zinc-700/50 rounded-full mb-6 py-1.5 px-3 gap-2 items-center">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
            Ship 10x faster with AI-powered research agents
          </div>

          {/* Hero Heading */}
          <h1
            ref={headingRef}
            className="text-5xl sm:text-6xl lg:text-7xl font-light text-zinc-100 tracking-tighter mb-6"
          >
            Intelligence, autonomously
            <br />
            compiled for you
          </h1>

          {/* Subheading */}
          <p
            ref={subRef}
            className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10"
          >
            Transform raw web data into executive-grade research reports in
            minutes. Powered by a relentless swarm of specialized AI agents.
          </p>

          {/* CTAs */}
          <div
            ref={ctaRef}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/sign-up">
              <button
                className="group inline-flex min-w-[180px] cursor-pointer overflow-hidden transition-transform duration-700 ease-[cubic-bezier(0.15,0.83,0.66,1)] hover:-translate-y-[3px] text-base font-medium text-white h-[48px] rounded-full py-3 px-6 relative shadow-[inset_0_2px_8px_rgba(255,255,255,0.25),_inset_0_-3px_8px_rgba(0,0,0,0.35),_0_4px_10px_rgba(0,0,0,0.4)] items-center justify-center"
                style={{
                  background:
                    "linear-gradient(45deg, #06b6d4, #3b82f6, #2563eb)",
                }}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 grid place-items-center will-change-transform transition-transform duration-500 ease-out group-hover:translate-y-8"
                >
                  <span className="block">Commence Research</span>
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 grid place-items-center will-change-transform transition-all duration-500 ease-out -translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                >
                  <span className="block">Commence Research</span>
                </span>
              </button>
            </Link>
            <button className="group inline-flex min-w-[180px] cursor-pointer overflow-hidden transition-transform duration-700 ease-[cubic-bezier(0.15,0.83,0.66,1)] hover:-translate-y-[3px] hover:text-white text-base font-medium text-neutral-300 tracking-tight bg-white/5 h-[48px] border border-white/15 rounded-full py-3 px-6 relative items-center justify-center">
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-1/2 h-[1px] w-[70%] -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent opacity-70 blur-[2px]"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-t from-white/15 via-white/10 to-transparent"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 grid place-items-center will-change-transform transition-transform duration-500 ease-out group-hover:translate-y-8"
              >
                <span className="block">Watch Demo</span>
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 grid place-items-center will-change-transform transition-all duration-500 ease-out -translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
              >
                <span className="block">Watch Demo</span>
              </span>
            </button>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div ref={dashRef} className="sm:px-6 lg:px-8 mt-24 mb-24 px-4">
          <div className="sm:p-3 bg-neutral-950 border border-neutral-800 ring-0 rounded-3xl p-2 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 relative">
              {/* Left Sidebar */}
              <aside className="lg:col-span-3 flex flex-col bg-neutral-900/60 ring-1 ring-neutral-800 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium tracking-tight">
                    ARIA
                  </span>
                  <button className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-800 transition text-neutral-300 ring-1 ring-neutral-800">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path d="M4 12h16" />
                      <path d="M4 6h16" />
                      <path d="M4 18h16" />
                    </svg>
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 ring-1 ring-neutral-700 flex items-center justify-center text-white text-xs font-bold">
                    AC
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium tracking-tight">
                      Alex Chen
                    </p>
                    <p className="text-neutral-400 text-xs">Lead Researcher</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-2 bg-neutral-900 ring-1 ring-neutral-800 rounded-xl px-3 py-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 text-neutral-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search reports..."
                      className="w-full bg-transparent outline-none text-sm text-neutral-200 placeholder-neutral-500"
                      readOnly
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
                    Navigation
                  </p>
                  <nav className="space-y-1">
                    <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-300 hover:bg-neutral-800 transition cursor-pointer">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                      </svg>
                      Dashboard
                    </span>
                    <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-100 bg-neutral-800 ring-1 ring-neutral-700 cursor-pointer">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-cyan-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Research Agent
                    </span>
                    <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-300 hover:bg-neutral-800 transition cursor-pointer">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path d="M12 2 2 7l10 5 10-5z" />
                        <path d="m2 17 10 5 10-5" />
                        <path d="m2 12 10 5 10-5" />
                      </svg>
                      Reports
                    </span>
                  </nav>
                </div>
                <div className="mt-6">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
                    Recent Research
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li className="px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 transition cursor-pointer">
                      AI Market Landscape 2026
                    </li>
                    <li className="px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 transition cursor-pointer">
                      FinTech Regulatory Analysis
                    </li>
                    <li className="px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 transition cursor-pointer">
                      SaaS Competitive Benchmark
                    </li>
                  </ul>
                </div>
                <div className="mt-auto pt-4">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 ring-1 ring-neutral-800 p-4">
                    <div className="absolute inset-x-0 -top-6 h-14 bg-gradient-to-b from-blue-500/10 to-transparent" />
                    <p className="text-sm text-white font-medium tracking-tight">
                      Upgrade to Pro
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Unlock unlimited research and deep analysis
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button className="ml-auto inline-flex items-center gap-2 text-xs text-white bg-blue-500 hover:bg-blue-400 transition rounded-full px-3 py-1.5 ring-1 ring-blue-400">
                        Upgrade now
                      </button>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Chat Area */}
              <main className="lg:col-span-6 bg-neutral-900/60 ring-1 ring-neutral-800 rounded-2xl p-4 sm:p-6 relative overflow-hidden flex flex-col">
                <header className="flex items-start justify-between mb-4 flex-shrink-0 z-10">
                  <div>
                    <h2 className="text-xl sm:text-2xl text-white font-light tracking-tight">
                      ARIA Research Agent
                    </h2>
                    <p className="text-sm text-neutral-400 mt-1">
                      Interactive AI-powered research engine
                    </p>
                  </div>
                </header>

                <div className="flex-1 rounded-2xl bg-gradient-to-b from-neutral-900/50 to-neutral-950/50 ring-1 ring-neutral-800/50 relative overflow-hidden flex flex-col">
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[320px] relative z-0">
                    <div
                      className="absolute inset-0 opacity-[0.03] pointer-events-none"
                      style={{
                        backgroundImage:
                          "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                      }}
                    />

                    {/* AI Greeting */}
                    <div className="flex items-start gap-3 relative z-10">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-cyan-500/20 flex items-center justify-center shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-white"
                        >
                          <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
                          <rect width="4" height="4" x="10" y="10" rx="1" />
                          <path d="M22 22v-4a6 6 0 0 0-12 0v4" />
                        </svg>
                      </div>
                      <div className="bg-neutral-800/80 ring-1 ring-white/5 text-neutral-200 text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm max-w-[85%]">
                        Ready to research. Enter your topic or describe what you
                        need analyzed.
                      </div>
                    </div>

                    {/* User Message */}
                    <div
                      className="flex flex-row-reverse items-start gap-3 relative z-10"
                      style={{
                        animation:
                          "chat-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) 1.2s forwards",
                        opacity: 0,
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-neutral-700 ring-1 ring-white/10 flex items-center justify-center shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-neutral-300"
                        >
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div className="bg-blue-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-md shadow-blue-900/20 max-w-[85%]">
                        Research the current state of autonomous AI agents in
                        enterprise SaaS — competitive landscape, key players,
                        and market trends.
                      </div>
                    </div>

                    {/* AI Response with code block */}
                    <div
                      className="flex items-start gap-3 relative z-10"
                      style={{
                        animation:
                          "chat-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) 3.8s forwards",
                        opacity: 0,
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-cyan-500/20 flex items-center justify-center shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-white"
                        >
                          <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
                          <rect width="4" height="4" x="10" y="10" rx="1" />
                          <path d="M22 22v-4a6 6 0 0 0-12 0v4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0 bg-neutral-900 ring-1 ring-neutral-800 rounded-2xl rounded-tl-sm overflow-hidden shadow-lg">
                        <div className="flex items-center justify-between px-4 py-2 bg-neutral-800/50 border-b border-neutral-800">
                          <span className="text-xs text-neutral-400 font-medium">
                            research_report.md
                          </span>
                          <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 ring-1 ring-red-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 ring-1 ring-yellow-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 ring-1 ring-green-500/50" />
                          </div>
                        </div>
                        <div className="p-4 overflow-x-auto">
                          <pre className="font-mono text-[11px] leading-relaxed">
                            <span className="text-purple-400"># </span>
                            <span className="text-cyan-200">
                              Autonomous AI Agents in Enterprise SaaS
                            </span>
                            {"\n"}
                            <span className="text-neutral-500">---</span>
                            {"\n"}
                            <span className="text-purple-400">## </span>
                            <span className="text-blue-300">
                              Market Overview
                            </span>
                            {"\n"}
                            <span className="text-neutral-300">
                              The autonomous AI agent market is projected to
                            </span>
                            {"\n"}
                            <span className="text-neutral-300">reach </span>
                            <span className="text-emerald-300">
                              $47.2B by 2027
                            </span>
                            <span className="text-neutral-300">
                              , growing at{" "}
                            </span>
                            <span className="text-emerald-300">34.1% CAGR</span>
                            {"\n\n"}
                            <span className="text-purple-400">## </span>
                            <span className="text-blue-300">Key Players</span>
                            {"\n"}
                            <span className="text-neutral-300">
                              - OpenAI (GPT-based agents)
                            </span>
                            {"\n"}
                            <span className="text-neutral-300">
                              - Anthropic (Claude tooling)
                            </span>
                            {"\n"}
                            <span className="text-neutral-300">
                              - Google DeepMind (Gemini)
                            </span>
                            {"\n"}
                            <span className="text-neutral-500">
                              // Sources: 12 verified, 3 pending review
                            </span>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="p-4 bg-neutral-900/80 border-t border-neutral-800 z-20">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 bg-neutral-950 ring-1 ring-neutral-800 rounded-xl px-3 py-2.5 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Describe your research topic..."
                          className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-neutral-500"
                          readOnly
                        />
                      </div>
                      <button className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 ring-1 ring-blue-400 text-white flex items-center justify-center transition-all shadow-lg shadow-blue-500/20">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m5 12 7-7 7 7" />
                          <path d="M12 19V5" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[10px] text-neutral-500">
                        AI-generated research may need verification.
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-800 ring-1 ring-neutral-700">
                          Multi-agent
                        </span>
                        <span className="text-[10px] text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-800 ring-1 ring-neutral-700">
                          RAG
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </main>

              {/* Right Sidebar */}
              <aside className="lg:col-span-3 flex flex-col bg-neutral-900/60 ring-1 ring-neutral-800 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs text-blue-200 bg-blue-900/40 rounded-full px-3 py-1 ring-1 ring-blue-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    ARIA Pro
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-6">
                  <button className="relative text-sm text-white">
                    <span>PIPELINE</span>
                    <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-white rounded-full" />
                  </button>
                  <button className="text-sm text-neutral-500">SETTINGS</button>
                </div>
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-neutral-300 font-medium tracking-tight">
                      Active Agents
                    </p>
                    <span className="inline-flex items-center text-[11px] text-black bg-cyan-400 rounded-full px-2 py-0.5 ring-1 ring-cyan-300">
                      Live
                    </span>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-3 rounded-xl ring-1 ring-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition cursor-pointer">
                      <span className="relative w-4 h-4 rounded-md ring-1 ring-neutral-700 bg-neutral-900" />
                      <p className="text-sm text-neutral-200">
                        Web Researcher Agent
                      </p>
                    </label>
                    <div className="p-3 rounded-xl ring-1 ring-blue-700 bg-blue-900/20">
                      <label className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="relative w-4 h-4 rounded-md ring-1 ring-blue-600 bg-blue-500/20">
                            <span className="absolute inset-0.5 rounded-[3px] bg-blue-400" />
                          </span>
                          <p className="text-sm text-neutral-200">
                            Analyst Agent
                          </p>
                        </div>
                      </label>
                      <ul className="mt-3 space-y-2 text-sm text-neutral-400 pl-7 list-disc">
                        <li>Corrective RAG grading</li>
                        <li>Source verification</li>
                      </ul>
                    </div>
                    <label className="flex items-start gap-3 p-3 rounded-xl ring-1 ring-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition cursor-pointer">
                      <span className="relative w-4 h-4 rounded-md ring-1 ring-neutral-700 bg-neutral-900" />
                      <p className="text-sm text-neutral-200">
                        Report Writer Agent
                      </p>
                    </label>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-sm text-neutral-300 font-medium tracking-tight">
                    Output Formats
                  </p>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl ring-1 ring-neutral-800 bg-neutral-900">
                      <div className="flex items-center gap-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4 text-neutral-300"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14,2 14,8 20,8" />
                        </svg>
                        <div>
                          <p className="text-sm text-neutral-200">
                            Markdown Report
                          </p>
                          <p className="text-xs text-neutral-500">
                            Executive summary + citations
                          </p>
                        </div>
                      </div>
                      <div className="relative w-10 h-6 rounded-full bg-blue-900/30 ring-1 ring-blue-600">
                        <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-blue-400" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl ring-1 ring-neutral-800 bg-neutral-900">
                      <div className="flex items-center gap-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4 text-neutral-300"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                        <div>
                          <p className="text-sm text-neutral-200">JSON Data</p>
                          <p className="text-xs text-neutral-500">
                            Structured raw output
                          </p>
                        </div>
                      </div>
                      <div className="relative w-10 h-6 rounded-full bg-neutral-800 ring-1 ring-neutral-700">
                        <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-neutral-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
