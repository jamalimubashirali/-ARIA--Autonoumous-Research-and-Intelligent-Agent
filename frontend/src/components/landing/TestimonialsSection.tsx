"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    name: "Sarah Chen",
    role: "VP of Research, DataVault",
    text: "ARIA replaced our entire 6-person research team's first-pass workflow. Reports that took 3 days now take 15 minutes.",
    avatar: "SC",
    gradient: "from-blue-600 to-cyan-600",
  },
  {
    name: "Marcus Rivera",
    role: "Strategy Director, NexaTech",
    text: "The corrective RAG system is genuinely magical. Every citation is verified, every claim is grounded. We've never had this confidence in AI outputs before.",
    avatar: "MR",
    gradient: "from-violet-600 to-purple-600",
  },
  {
    name: "Emily Zhang",
    role: "Product Lead, CloudForge",
    text: "We integrated ARIA into our product planning pipeline. Competitive analyses that felt like guesswork now come with real data and real sources.",
    avatar: "EZ",
    gradient: "from-emerald-600 to-teal-600",
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
        <div data-test-heading className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-zinc-100 tracking-tighter mb-4">
            Trusted by research teams
          </h2>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            See how industry leaders are transforming their research workflows
            with ARIA.
          </p>
        </div>

        {/* Marquee */}
        <div className="relative overflow-hidden">
          {/* Gradient masks */}
          <div className="absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-zinc-950 to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />

          <div
            className="flex gap-4 hover:[animation-play-state:paused]"
            style={{
              animation: "marquee-scroll 30s linear infinite",
              width: "fit-content",
            }}
          >
            {/* Duplicate for seamless loop */}
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={`${t.name}-${i}`}
                className="flex-shrink-0 w-[400px] p-6 rounded-3xl bg-zinc-950 ring-1 ring-white/10 border-gradient"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-sm font-bold`}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm text-zinc-100 font-medium">
                      {t.name}
                    </p>
                    <p className="text-xs text-zinc-500">{t.role}</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex gap-1 mt-4">
                  {[...Array(5)].map((_, j) => (
                    <svg
                      key={j}
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 text-yellow-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
