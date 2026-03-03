"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Loader2,
  ArrowRight,
  Calendar,
  Search,
  History,
} from "lucide-react";
import { useApiClient } from "@/lib/api";
import { motion, Variants } from "framer-motion";
import { format } from "date-fns";
import Link from "next/link";

interface Report {
  id: string;
  query: string;
  title: string | null;
  domain: string;
  created_at: string;
  rating?: number;
}

export default function HistoryPage() {
  const { fetch } = useApiClient();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [fetch]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 mt-8 pb-20">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
          <History className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
          Intelligence Archives
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl text-lg">
          Review, export, and manage your previously generated agentic research
          reports.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-destructive">{error}</div>
      ) : reports.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-muted/10 border border-muted/20 rounded-xl backdrop-blur-sm"
        >
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Reports Found</h3>
          <p className="text-muted-foreground mb-6">
            Your agent hasn't completed any research tasks yet.
          </p>
          <Button asChild>
            <Link href="/dashboard/research">Start New Research</Link>
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {reports.map((report) => (
            <motion.div key={report.id} variants={itemVariants}>
              <Card className="h-full flex flex-col border-muted bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all group overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold tracking-wider uppercase text-primary/80 bg-primary/10 px-2 py-1 rounded-sm">
                      {report.domain}
                    </span>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      {format(new Date(report.created_at), "MMM d, yyyy")}
                    </div>
                  </div>
                  <CardTitle className="text-lg line-clamp-2 leading-tight">
                    {report.title || report.query.split(".")[0]}
                  </CardTitle>
                </CardHeader>
                <CardFooter className="mt-auto relative pt-4 border-t border-muted/30 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="group/btn"
                    asChild
                  >
                    <Link href={`/dashboard/reports/${report.id}`}>
                      View Report
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
