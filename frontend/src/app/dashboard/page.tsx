"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  FileText,
  Zap,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Send,
  Paperclip,
  Globe,
  Loader2,
} from "lucide-react";
import { useApiClient } from "@/lib/api";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ShimmerBlock } from "@/components/ui/shimmer-skeleton";
import { useGSAP } from "@gsap/react";
import { gsap, staggerIn } from "@/lib/gsap-config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/api";

type UsageData = {
  plan: string;
  reports_this_month: number;
  reports_limit: number;
  usage_reset_date: string;
  can_generate: boolean;
};

export default function DashboardPage() {
  const api = useApiClient();
  const router = useRouter();
  const { getToken } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentCount, setRecentCount] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Research dock state
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Try usage endpoint first, fall back gracefully
        const usageRes = await api.fetch("/api/v1/user/usage");
        if (usageRes.ok) {
          const data = await usageRes.json();
          setUsage(data);
        }
      } catch {
        // Usage endpoint may not exist — that's fine
      }

      try {
        // Get report count from history
        const reportsRes = await api.fetch("/api/v1/reports?limit=50");
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setRecentCount(data.data?.length || 0);
        }
      } catch {
        // Ignore
      }

      setLoading(false);
    }
    loadData();
  }, [api]);

  // GSAP stagger animation on cards
  useGSAP(
    () => {
      if (loading || !containerRef.current) return;
      const cards = containerRef.current.querySelectorAll(".bento-card");
      staggerIn(cards, { stagger: 0.12, y: 30 });
    },
    { dependencies: [loading], scope: containerRef },
  );

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  };

  const handleSubmit = async () => {
    if (!query.trim() || isSubmitting) return;
    setIsSubmitting(true);
    // Navigate to research page with query
    router.push(`/dashboard/research?q=${encodeURIComponent(query.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 mt-4 pb-40" ref={containerRef}>
      {/* Hero greeting */}
      <div className="space-y-2">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400">
          Command Center
        </h1>
        <p className="text-zinc-500 text-lg max-w-xl">
          Monitor your autonomous research operations and agent performance.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Reports Count */}
        <Card className="bento-card glow-card border-0 bg-zinc-900/50 backdrop-blur-xl ring-1 ring-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
              Reports Generated
            </CardTitle>
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <FileText className="h-5 w-5 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ShimmerBlock className="h-12 w-24" />
            ) : (
              <>
                <div className="text-5xl font-bold tracking-tight text-zinc-100">
                  <AnimatedCounter
                    value={usage?.reports_this_month ?? recentCount}
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <p className="text-sm text-zinc-500">
                    this month
                    {usage?.reports_limit !== -1 &&
                    usage?.reports_limit !== undefined
                      ? ` · ${usage.reports_limit - (usage?.reports_this_month || 0)} remaining`
                      : " · unlimited"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Current Plan */}
        <Card className="bento-card glow-card border-0 bg-zinc-900/50 backdrop-blur-xl ring-1 ring-white/10 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
              Plan
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ShimmerBlock className="h-10 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold capitalize tracking-tight text-zinc-100">
                  {usage?.plan || "Free"}
                </div>
                <p className="text-sm text-zinc-500 mt-1">
                  {usage?.reports_limit === -1 ||
                  usage?.reports_limit === undefined
                    ? "Unlimited"
                    : `${usage?.reports_limit}/mo`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Agent Status */}
        <Card className="bento-card glow-card border-0 bg-zinc-900/50 backdrop-blur-xl ring-1 ring-white/10 relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
              Agent Status
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Activity className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="relative w-3 h-3">
                <div className="absolute inset-0 rounded-full bg-emerald-500 pulse-indicator" />
                <div className="absolute inset-0 rounded-full bg-emerald-500" />
              </div>
              <span className="text-2xl font-bold text-zinc-100">Idle</span>
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Research Dock (Perplexity / ChatGPT style) ─── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[min(calc(100%-2rem),720px)]">
        <div className="relative rounded-2xl bg-zinc-900/90 backdrop-blur-2xl ring-1 ring-white/10 shadow-2xl shadow-black/40 overflow-hidden">
          {/* Input area */}
          <div className="flex items-end gap-3 p-4">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="What would you like to research?"
              rows={1}
              className="flex-1 resize-none bg-transparent text-zinc-100 placeholder:text-zinc-600 text-base leading-relaxed focus:outline-none max-h-40 overflow-y-auto scrollbar-thin"
              style={{ minHeight: "28px" }}
            />
            <button
              onClick={handleSubmit}
              disabled={!query.trim() || isSubmitting}
              className="shrink-0 p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 transition-all duration-200 active:scale-95"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-4 pb-3 pt-0">
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition">
                <Globe className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition">
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            <span className="text-[11px] text-zinc-700">
              Press Enter to deploy agents
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
