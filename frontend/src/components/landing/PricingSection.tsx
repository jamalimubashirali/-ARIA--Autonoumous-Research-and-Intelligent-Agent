"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const plans = {
  starter: { monthly: 0, yearly: 0 },
  pro: { monthly: 29, yearly: 290 },
};

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-price-heading]", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      gsap.from("[data-price-card]", {
        y: 60,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "[data-price-card]",
          start: "top 80%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="w-full px-4 py-24 relative z-10"
    >
      <div className="max-w-5xl mx-auto">
        <div data-price-heading className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-zinc-100 tracking-tighter mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8">
            Start free. Upgrade when your research demands it.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-zinc-900 ring-1 ring-white/10 rounded-full p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !isYearly
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                isYearly
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Yearly
              <span className="ml-1.5 text-[10px] text-emerald-400 font-semibold">
                -17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Starter */}
          <div
            data-price-card
            className="relative rounded-3xl bg-zinc-950 ring-1 ring-white/10 p-8 border-gradient hover-lift"
          >
            <h3 className="text-xl text-zinc-100 font-medium tracking-tight">
              Starter
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              For individuals exploring AI research.
            </p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-5xl font-light text-zinc-100">
                ${isYearly ? plans.starter.yearly : plans.starter.monthly}
              </span>
              <span className="text-zinc-500 text-sm">
                /{isYearly ? "year" : "month"}
              </span>
            </div>
            <Link href="/sign-up">
              <button className="mt-6 w-full py-3 rounded-full bg-white/10 ring-1 ring-white/15 text-white text-sm font-medium hover:bg-white/15 transition">
                Get Started Free
              </button>
            </Link>
            <ul className="mt-8 space-y-3">
              {[
                "5 research reports / month",
                "Basic web search",
                "Standard report formatting",
                "Community support",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-zinc-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-zinc-500 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div
            data-price-card
            className="relative rounded-3xl bg-zinc-950 ring-2 ring-blue-500/50 p-8 border-gradient hover-lift shadow-lg shadow-blue-500/10"
          >
            <div className="absolute top-6 right-6">
              <span className="text-[10px] text-blue-200 bg-blue-500/20 ring-1 ring-blue-500/30 rounded-full px-3 py-1 font-semibold">
                POPULAR
              </span>
            </div>
            <h3 className="text-xl text-zinc-100 font-medium tracking-tight">
              Pro
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              For teams that need deep, verified research.
            </p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-5xl font-light text-zinc-100">
                ${isYearly ? plans.pro.yearly : plans.pro.monthly}
              </span>
              <span className="text-zinc-500 text-sm">
                /{isYearly ? "year" : "month"}
              </span>
            </div>
            <Link href="/sign-up">
              <button
                className="mt-6 w-full py-3 rounded-full text-white text-sm font-medium transition shadow-lg shadow-blue-500/20 hover:brightness-110"
                style={{
                  background:
                    "linear-gradient(45deg, #06b6d4, #3b82f6, #2563eb)",
                }}
              >
                Upgrade to Pro
              </button>
            </Link>
            <ul className="mt-8 space-y-3">
              {[
                "Unlimited research reports",
                "Advanced multi-source crawling",
                "Corrective RAG + source verification",
                "Custom report templates",
                "Priority support",
                "Team collaboration",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-zinc-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-blue-400 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
