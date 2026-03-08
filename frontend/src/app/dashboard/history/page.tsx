"use client";

import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Search,
  History,
  Sparkles,
} from "lucide-react";
import { useApiClient } from "@/lib/api";
import { useGSAP } from "@gsap/react";
import { staggerIn } from "@/lib/gsap-config";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

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
  return DOMAIN_COLORS[domain.toLowerCase()] || DOMAIN_COLORS.general;
}

export default function HistoryPage() {
  const router = useRouter();
  const { fetch } = useApiClient();
  const { isLoaded, isSignedIn } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    async function loadReports() {
      try {
        const res = await fetch("/api/v1/reports?limit=50");
        if (!res.ok) {
          throw new Error("Failed to load reports");
        }
        const data = await res.json();
        setReports(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [fetch, isLoaded, isSignedIn]);

  // GSAP stagger animation
  useGSAP(
    () => {
      if (loading || !gridRef.current) return;
      const cards = gridRef.current.querySelectorAll(".report-card");
      staggerIn(cards, { stagger: 0.08, y: 25 });
    },
    { dependencies: [loading], scope: gridRef },
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 mt-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="group hover:bg-cyan-500/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Terminal
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-2">
            <History className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Intelligence Archives
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Access and manage previously synthesized research reports. Your
            central repository for agentic insights.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-destructive">{error}</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-card/40 backdrop-blur-xl border border-border/30 rounded-xl">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Reports Found</h3>
          <p className="text-muted-foreground mb-6">
            Your agent hasn&apos;t completed any research tasks yet.
          </p>
          <Button
            asChild
            className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold shadow-md shadow-cyan-500/20 transition-all"
          >
            <Link href="/research">Start New Research</Link>
          </Button>
        </div>
      ) : (
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="report-card group bg-white dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 hover:border-zinc-300 dark:border-white/5 dark:hover:border-white/10 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_8px_20px_rgba(0,0,0,0.2)] hover:shadow-md dark:hover:bg-zinc-900/50 transition-all duration-300 min-h-[240px] flex flex-col overflow-hidden relative"
            >
              {/* Top gradient line */}
              <div className="absolute top-0 left-0 right-0 h-[100px] bg-gradient-to-b from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/0 to-transparent group-hover:via-cyan-500/50 transition-all duration-500" />

              <CardHeader className="relative pb-3 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-semibold tracking-wider uppercase px-2.5 py-1 rounded-md border ${getDomainColor(
                      report.domain,
                    )}`}
                  >
                    {report.domain}
                  </span>
                  <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(report.created_at), "MMM d, yyyy")}
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-2 leading-snug font-semibold">
                  {report.title || report.query.split(".")[0]}
                </CardTitle>
              </CardHeader>

              {/* Preview excerpt */}
              {report.content && (
                <CardContent className="pt-0 pb-3">
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {report.content
                      .replace(/^#{1,3}\s+.+$/gm, "")
                      .replace(/\*+/g, "")
                      .trim()
                      .slice(0, 150)}
                    ...
                  </p>
                </CardContent>
              )}

              <CardFooter className="mt-auto relative pt-3 border-t border-border/20 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="group/btn text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:text-cyan-300 dark:hover:bg-cyan-950/50 transition-colors font-medium"
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
  );
}
