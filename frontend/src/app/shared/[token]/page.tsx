"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";
import {
  Calendar,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  BrainCircuit,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";

interface SharedReport {
  id: string;
  query: string;
  domain: string;
  content: string;
  sources: { items: { title: string; url: string }[] } | null;
  created_at: string;
}

export default function SharedReportPage() {
  const params = useParams();
  const token = params.token as string;

  const [report, setReport] = useState<SharedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSharedReport() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/shared/${token}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Shared report not found or link has expired");
          }
          throw new Error("Failed to load shared report");
        }
        const data = await res.json();
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    if (token) {
      loadSharedReport();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 pt-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Loading shared intelligence...
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 pt-20">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground max-w-md text-center">
          {error || "Report not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <BrainCircuit className="w-6 h-6 text-primary" />
            <span>ARIA</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Verified Shared Intelligence
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto space-y-8 mt-12 px-4 pb-20"
      >
        {/* Title Card */}
        <Card className="border-primary/20 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
          <CardHeader className="pb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold tracking-wider uppercase text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center">
                <Sparkles className="w-3 h-3 mr-1" />
                {report.domain}
              </span>
            </div>
            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              {report.query}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {format(
                  new Date(report.created_at),
                  "MMMM d, yyyy 'at' h:mm a",
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Card className="border-muted bg-card/60 backdrop-blur-xl shadow-lg">
          <CardContent className="p-6 sm:p-10 prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {report.content}
            </ReactMarkdown>
          </CardContent>
        </Card>

        {/* Sources */}
        {report.sources &&
          report.sources.items &&
          report.sources.items.length > 0 && (
            <Card className="border-muted bg-card/60 backdrop-blur-xl shadow-lg mt-8">
              <CardHeader>
                <CardTitle className="text-xl">Intelligence Sources</CardTitle>
                <CardDescription>
                  Verified origins of extracted data points.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {report.sources.items.map((source, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-primary hover:underline transition-colors line-clamp-2"
                      >
                        {source.title || source.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
      </motion.div>
    </div>
  );
}
