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
  Calendar,
  Search,
  History,
  Sparkles,
} from "lucide-react";
import { useApiClient } from "@/lib/api";
import { useGSAP } from "@gsap/react";
import { staggerIn } from "@/lib/gsap-config";
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
      <div className="space-y-2">
        <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-primary/10 mb-3">
          <History className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400">
          Intelligence Archives
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl">
          Review, export, and manage your agentic research reports.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/dashboard/research">Start New Research</Link>
          </Button>
        </div>
      ) : (
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="report-card glow-card h-full flex flex-col border-border/30 bg-card/50 backdrop-blur-xl overflow-hidden relative group"
            >
              {/* Top gradient line */}
              <div className="h-[2px] bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />

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
                  className="group/btn text-muted-foreground hover:text-foreground"
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
