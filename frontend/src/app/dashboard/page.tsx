"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  FileText,
  Zap,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useApiClient } from "@/lib/api";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ShimmerBlock } from "@/components/ui/shimmer-skeleton";
import { useGSAP } from "@gsap/react";
import { gsap, staggerIn } from "@/lib/gsap-config";
import Link from "next/link";

type UsageData = {
  plan: string;
  reports_this_month: number;
  reports_limit: number;
  usage_reset_date: string;
  can_generate: boolean;
};

export default function DashboardPage() {
  const api = useApiClient();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUsage() {
      try {
        const response = await api.fetch("/api/v1/user/usage");
        if (response.ok) {
          const data = await response.json();
          setUsage(data);
        }
      } catch (err) {
        console.error("Failed to fetch usage data", err);
      } finally {
        setLoading(false);
      }
    }
    loadUsage();
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 mt-4" ref={containerRef}>
      {/* Hero greeting */}
      <div className="space-y-2">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight gradient-text">
          Command Center
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl">
          Monitor your autonomous research operations and agent performance.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Reports Count — Large Card */}
        <Card className="bento-card glow-card md:col-span-2 border-border/40 bg-card/60 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Reports Generated
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ShimmerBlock className="h-12 w-24" />
            ) : (
              <>
                <div className="text-5xl font-bold tracking-tight">
                  <AnimatedCounter value={usage?.reports_this_month || 0} />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <p className="text-sm text-muted-foreground">
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
        <Card className="bento-card glow-card border-border/40 bg-card/60 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-chart-4/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
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
                <div className="text-3xl font-bold capitalize tracking-tight">
                  {usage?.plan || "Free"}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
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
        <Card className="bento-card glow-card border-border/40 bg-card/60 backdrop-blur-xl relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
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
              <span className="text-2xl font-bold">Idle</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              All systems operational
            </p>
          </CardContent>
        </Card>

        {/* Quick-Start CTA */}
        <Card className="bento-card md:col-span-2 lg:col-span-4 gradient-border bg-card/60 backdrop-blur-xl relative overflow-hidden">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Ready to launch a new investigation?
                </h3>
                <p className="text-sm text-muted-foreground">
                  ARIA will plan, research, analyze, and write a comprehensive
                  report.
                </p>
              </div>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 group"
            >
              <Link href="/dashboard/research">
                New Research
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
