"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit,
  Search,
  FileText,
  Activity,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from "lucide-react";

export function LandingHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll progress within the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Hero section animations
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);

  // Features section animations
  const featuresOpacity = useTransform(
    scrollYProgress,
    [0.15, 0.3, 0.6, 0.8],
    [0, 1, 1, 0],
  );
  const featuresY = useTransform(scrollYProgress, [0.15, 0.3], [100, 0]);

  // CTA section animations
  const ctaOpacity = useTransform(scrollYProgress, [0.7, 0.9], [0, 1]);
  const ctaScale = useTransform(scrollYProgress, [0.7, 0.9], [0.9, 1]);

  return (
    <div ref={containerRef} className="relative h-[300vh] bg-background">
      {/* Sticky container that holds the visible content */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px]" />
        </div>

        {/* 1. HERO SECTION */}
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">
              ARIA Intelligence Engine 1.0
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 max-w-5xl"
          >
            Intelligence, <br /> autonomously compiled.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="mt-8 text-xl md:text-2xl text-muted-foreground max-w-2xl font-light"
          >
            Transform raw web data into executive-grade research reports in
            minutes. Powered by a relentless swarm of specialized AI agents.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mt-12 flex flex-col sm:flex-row gap-4"
          >
            <Link href="/sign-up">
              <Button
                size="lg"
                className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/25 group"
              >
                Commence Research
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce text-muted-foreground"
          >
            <span className="text-xs uppercase tracking-widest mb-2 font-semibold">
              Scroll to explore
            </span>
            <div className="w-px h-10 bg-gradient-to-b from-muted-foreground to-transparent" />
          </motion.div>
        </motion.div>

        {/* 2. FEATURES / HOW IT WORKS */}
        <motion.div
          style={{ opacity: featuresOpacity, y: featuresY }}
          className="absolute inset-0 flex flex-col items-center justify-center z-20 px-4 max-w-6xl mx-auto"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              A symphony of agents.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              ARIA doesn't just query an LLM. It plans, retrieves, grades,
              rewrites, and verifies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {/* Feature 1 */}
            <div className="group relative p-8 rounded-3xl bg-card border border-border shadow-2xl overflow-hidden hover:border-primary/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Search className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                Tireless Retrieval
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                The Researcher agent crawls the live web and internal vectors
                simultaneously, gathering raw context without human limits.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative p-8 rounded-3xl bg-card border border-border shadow-2xl overflow-hidden hover:border-primary/50 transition-colors md:-translate-y-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
                <Activity className="w-7 h-7 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Corrective RAG</h3>
              <p className="text-muted-foreground leading-relaxed">
                The Analyst grades every chunk of data. Irrelevant findings? It
                rewrites the query and tries again. Only truth passes through.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative p-8 rounded-3xl bg-card border border-border shadow-2xl overflow-hidden hover:border-primary/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Editorial Review</h3>
              <p className="text-muted-foreground leading-relaxed">
                Before you see it, the Reviewer agent brutally critiques the
                report for accuracy, completeness, and citations.
              </p>
            </div>
          </div>
        </motion.div>

        {/* 3. CTA SECTION */}
        <motion.div
          style={{ opacity: ctaOpacity, scale: ctaScale }}
          className="absolute inset-0 flex flex-col items-center justify-center z-30 px-4 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-8 shadow-xl shadow-primary/20">
            <BrainCircuit className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            Ready for absolute clarity?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mb-12">
            Stop drowning in generic LLM outputs. Get verified, structured, and
            deep research instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="h-14 px-10 text-lg rounded-full shadow-2xl shadow-primary/40"
              >
                Deploy ARIA Now
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 sm:mt-0 sm:ml-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit
              card required.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
