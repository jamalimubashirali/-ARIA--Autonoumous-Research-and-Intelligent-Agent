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
  const { getToken } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentCount, setRecentCount] = useState<number>(0);
  const [reports, setReports] = useState<Report[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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
        // Get reports history
        const reportsRes = await api.fetch("/api/v1/reports?limit=50");
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setReports(data.data || []);
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
    <div
      className="max-w-6xl mx-auto space-y-8 mt-4 pb-8 min-h-[calc(100vh-6rem)] flex flex-col"
      ref={containerRef}
    >
      {/* Hero greeting */}
      <div className="space-y-2">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neutral-800 via-cyan-600 to-cyan-500 dark:from-white dark:via-cyan-200 dark:to-cyan-400">
          Command Center
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl">
          Monitor your autonomous research operations and agent performance.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Reports Count */}
        <Card className="bento-card glow-card h-[160px] flex flex-col border-0 bg-card/80 dark:bg-black/20 backdrop-blur-3xl ring-1 ring-border dark:ring-white/10 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Reports Generated
            </CardTitle>
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <FileText className="h-5 w-5 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end">
            {loading ? (
              <ShimmerBlock className="h-10 w-24" />
            ) : (
              <div>
                <div className="text-4xl font-bold tracking-tight text-foreground">
                  <AnimatedCounter
                    value={usage?.reports_this_month ?? recentCount}
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
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
        <Card className="bento-card glow-card h-[160px] flex flex-col border-0 bg-card/80 dark:bg-black/20 backdrop-blur-3xl ring-1 ring-border dark:ring-white/10 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Plan
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end">
            {loading ? (
              <ShimmerBlock className="h-10 w-20" />
            ) : (
              <div>
                <div className="text-4xl font-bold capitalize tracking-tight text-foreground">
                  {usage?.plan || "Free"}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {usage?.reports_limit === -1 ||
                  usage?.reports_limit === undefined
                    ? "Unlimited"
                    : `${usage?.reports_limit}/mo`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Status */}
        <Card className="bento-card glow-card h-[160px] flex flex-col border-0 bg-card/80 dark:bg-black/20 backdrop-blur-3xl ring-1 ring-border dark:ring-white/10 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Agent Status
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Activity className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end">
            <div>
              <div className="flex items-center gap-3">
                <div className="relative w-3.5 h-3.5">
                  <div className="absolute inset-0 rounded-full bg-emerald-500 pulse-indicator" />
                  <div className="absolute inset-0 rounded-full bg-emerald-500" />
                </div>
                <span className="text-4xl font-bold tracking-tight text-foreground">
                  Idle
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                All systems operational
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports History */}
      <div className="pt-8 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
          <h2 className="text-2xl font-semibold tracking-tight text-foreground text-transparent bg-clip-text bg-gradient-to-r from-neutral-800 via-cyan-600 to-cyan-500 dark:from-white dark:via-cyan-200 dark:to-cyan-400">
            Intelligence Archives
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 bg-card/80 dark:bg-black/20 backdrop-blur-3xl ring-1 ring-border dark:ring-white/10 rounded-2xl">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              No Reports Found
            </h3>
            <p className="text-muted-foreground mb-6">
              Your agent hasn&apos;t completed any research tasks yet.
            </p>
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {reports.map((report) => (
              <Card
                key={report.id}
                className="report-card glow-card h-[220px] flex flex-col border-0 bg-card/80 dark:bg-black/20 backdrop-blur-3xl ring-1 ring-border dark:ring-white/10 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden relative group"
              >
                {/* Top gradient line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500/60 via-cyan-500/20 to-transparent" />

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
                  <CardTitle className="text-lg line-clamp-1 leading-snug font-semibold text-foreground">
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

                <CardFooter className="mt-auto relative pt-4 pb-4 border-t border-border dark:border-white/5 flex justify-end flex-none">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="group/btn text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10"
                    asChild
                  >
                    <Link href={`/dashboard/reports/${report.id}`}>
                      View Report
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ─── Research Dock (Perplexity / ChatGPT style) ─── */}
      <div className="sticky bottom-6 z-40 w-full max-w-[720px] mx-auto mt-12">
        <div className="relative rounded-2xl bg-card/90 dark:bg-black/40 backdrop-blur-3xl ring-1 ring-border dark:ring-white/20 shadow-xl dark:shadow-2xl dark:shadow-black/40 overflow-hidden">
          {/* Input area */}
          <div className="flex items-end gap-3 p-4">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="What would you like to research?"
              rows={1}
              className="flex-1 resize-none bg-transparent text-foreground placeholder-muted-foreground font-medium text-base leading-relaxed focus:outline-none max-h-40 overflow-y-auto scrollbar-thin"
              style={{ minHeight: "28px" }}
            />
            <GlassActionButton
              onClick={handleSubmit}
              disabled={!query.trim() || isSubmitting}
              glowColor="cyan"
              className="shrink-0 w-11 h-11 !rounded-xl p-0"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin text-cyan-500 dark:text-cyan-400" />
              ) : (
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
              )}
            </GlassActionButton>
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-4 pb-3 pt-0">
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/5 transition">
                <Globe className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/5 transition">
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Press Enter to deploy agents
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
