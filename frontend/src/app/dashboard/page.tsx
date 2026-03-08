"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  TrendingUp,
  Activity,
  Zap,
  ArrowRight,
  Loader2,
  Globe,
  Paperclip,
  Calendar,
  History,
  Search,
} from "lucide-react";
import { GlassActionButton } from "@/components/ui/glass-action-button";
import { useApiClient } from "@/lib/api";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ShimmerBlock } from "@/components/ui/shimmer-skeleton";
import { useGSAP } from "@gsap/react";
import { gsap, staggerIn } from "@/lib/gsap-config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { format } from "date-fns";
import { API_BASE_URL } from "@/lib/api";

type UsageData = {
  plan: string;
  reports_this_month: number;
  reports_limit: number;
  usage_reset_date: string;
  can_generate: boolean;
};

interface Report {
  id: string;
  query: string;
  title: string | null;
  domain: string;
  content?: string;
  created_at: string;
  rating?: number;
}

const DOMAIN_COLORS: Record<string, string> = {
  healthcare: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  finance: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  technology: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  education: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  sales: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  marketing: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  legal: "bg-yellow-600/15 text-yellow-500 border-yellow-600/20",
  general: "bg-muted text-muted-foreground border-border",
};

function getDomainColor(domain: string) {
  return DOMAIN_COLORS[domain?.toLowerCase()] || DOMAIN_COLORS.general;
}

export default function DashboardPage() {
  const api = useApiClient();
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalReports, setTotalReports] = useState<number>(0);
  const [reports, setReports] = useState<Report[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Research dock state
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

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
        // Get reports history
        const reportsRes = await api.fetch("/api/v1/reports?limit=50");
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setReports(data.data || []);
          setTotalReports(data.total || data.data?.length || 0);
        }
      } catch {
        // Ignore
      }

      setLoading(false);
    }
    loadData();
  }, [api, isLoaded, isSignedIn]);

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
    // Store query in sessionStorage to avoid long URL issues
    sessionStorage.setItem("pending_research_query", query.trim());
    // Navigate to research page
    router.push(`/research`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="max-w-6xl mx-auto space-y-8 mt-4 pb-32 min-h-[calc(100vh-6rem)] flex flex-col px-4 xl:px-0"
      ref={containerRef}
    >
      {/* Hero greeting */}
      <div className="space-y-4 mb-4">
        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500">
          Command Center
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl font-medium">
          Monitor your autonomous research operations and agent performance.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Reports Count */}
        <Card className="bento-card group min-h-[160px] flex flex-col border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/20 backdrop-blur-2xl shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-md dark:hover:bg-zinc-900/40 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[200%] h-[200%] bg-gradient-to-bl from-cyan-500/10 via-transparent to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Reports Generated
            </CardTitle>
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <FileText className="h-5 w-5 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end relative z-10">
            {loading ? (
              <ShimmerBlock className="h-10 w-24" />
            ) : (
              <div>
                <div className="text-5xl font-bold tracking-tight text-foreground">
                  <AnimatedCounter
                    value={Math.max(
                      usage?.reports_this_month || 0,
                      totalReports,
                    )}
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-muted-foreground">
                    this month
                    {usage?.reports_limit !== -1 &&
                    usage?.reports_limit !== undefined
                      ? ` · ${usage.reports_limit - (usage?.reports_this_month || 0)} remaining`
                      : " · unlimited"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Plan */}
        <Card className="bento-card group min-h-[160px] flex flex-col border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/20 backdrop-blur-2xl shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-md dark:hover:bg-zinc-900/40 transition-all duration-500 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-[200%] h-[200%] bg-gradient-to-tr from-amber-500/10 via-transparent to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Plan
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end relative z-10">
            {loading ? (
              <ShimmerBlock className="h-10 w-20" />
            ) : (
              <div>
                <div className="text-5xl font-bold capitalize tracking-tight text-foreground">
                  {usage?.plan || "Free"}
                </div>
                <p className="text-sm font-medium text-muted-foreground mt-2">
                  {usage?.reports_limit === -1 ||
                  usage?.reports_limit === undefined
                    ? "Unlimited"
                    : `${usage?.reports_limit}/mo`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reports History */}
      <div className="pt-10 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Globe className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Intelligence Archives
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 border border-border/40 bg-card/40 dark:bg-zinc-900/20 backdrop-blur-2xl rounded-3xl shadow-sm">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4 border border-border/50">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">
              No Reports Found
            </h3>
            <p className="text-muted-foreground font-medium mb-6">
              Your agent hasn&apos;t completed any research tasks yet.
            </p>
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {reports.map((report) => (
              <Card
                key={report.id}
                className="report-card group bg-white dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 hover:border-zinc-300 dark:border-white/5 dark:hover:border-white/10 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_8px_20px_rgba(0,0,0,0.2)] hover:shadow-md dark:hover:bg-zinc-900/50 transition-all duration-300 min-h-[240px] flex flex-col overflow-hidden relative"
              >
                {/* Top glow hover effect */}
                <div className="absolute top-0 left-0 right-0 h-[100px] bg-gradient-to-b from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/0 to-transparent group-hover:via-cyan-500/50 transition-all duration-500" />

                <CardHeader className="relative pb-3 pt-6 flex-none">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border ${getDomainColor(
                        report.domain,
                      )}`}
                    >
                      {report.domain || "research"}
                    </span>
                    <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(report.created_at), "MMM d, yyyy")}
                    </div>
                  </div>
                  <CardTitle className="text-xl line-clamp-1 leading-snug font-bold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {report.title || report.query.split(".")[0]}
                  </CardTitle>
                </CardHeader>

                {/* Preview excerpt */}
                {report.content && (
                  <CardContent className="pt-0 pb-3 flex-1 overflow-hidden">
                    <p className="text-sm text-muted-foreground font-medium line-clamp-3 leading-relaxed">
                      {report.content
                        .replace(/^#{1,3}\s+.+$/gm, "")
                        .replace(/\*+/g, "")
                        .trim()
                        .slice(0, 200)}
                      ...
                    </p>
                  </CardContent>
                )}

                <CardFooter className="mt-auto relative pt-4 pb-4 border-t border-border/50 dark:border-white/5 flex justify-end flex-none z-10">
                  <Link href={`/dashboard/reports/${report.id}`}>
                    <GlassActionButton
                      glowColor="cyan"
                      className="px-6 py-3 !rounded-full font-semibold"
                    >
                      Open Report
                      <ArrowRight className="w-4 h-4 ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
                    </GlassActionButton>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ─── Premium Research Dock ─── */}
      <div className="sticky bottom-6 z-40 w-full max-w-[800px] mx-auto mt-12 pb-4">
        <div className="relative rounded-3xl bg-background/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-border/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.6)] overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-cyan-500/40 focus-within:border-cyan-500/40 group">
          {/* Subtle animated inner glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-purple-500/5 opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Input area */}
          <div className="relative flex flex-col p-2">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="What would you like to research?"
              rows={1}
              className="w-full resize-none bg-transparent text-foreground placeholder-muted-foreground/60 font-medium text-lg px-4 py-3 focus:outline-none max-h-[30vh] overflow-y-auto scrollbar-thin"
              style={{ minHeight: "56px" }}
            />

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between px-3 pb-2 mt-2">
              <div className="flex items-center gap-1.5">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/10 transition-colors border border-transparent hover:border-border/50">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Pro Search</span>
                </button>
                <button
                  className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/10 transition-colors"
                  title="Attach context"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-muted-foreground/60 hidden sm:inline-flex items-center gap-1.5">
                  Press{" "}
                  <kbd className="px-1.5 py-0.5 rounded-[4px] bg-muted border border-border text-[10px] uppercase font-sans font-semibold">
                    Enter
                  </kbd>{" "}
                  to research
                </span>
                <GlassActionButton
                  onClick={handleSubmit}
                  disabled={!query.trim() || isSubmitting}
                  glowColor="cyan"
                  className="shrink-0 w-11 h-11 !rounded-full p-0 flex items-center justify-center bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md group-focus-within:bg-cyan-600 group-focus-within:text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </GlassActionButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
