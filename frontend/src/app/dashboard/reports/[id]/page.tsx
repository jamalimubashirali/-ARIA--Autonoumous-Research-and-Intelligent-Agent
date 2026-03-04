"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApiClient } from "@/lib/api";
import { motion } from "framer-motion";
import NotionMarkdown from "@/components/notion-markdown";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  Share2,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReportDetail {
  id: string;
  query: string;
  title: string | null;
  domain: string;
  content: string;
  sources: { items: { title: string; url: string }[] } | null;
  token_count: number | null;
  generation_time_ms: number | null;
  created_at: string;
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { fetch } = useApiClient();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`/api/v1/reports/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Report not found");
          }
          throw new Error("Failed to load report");
        }
        const data = await res.json();
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadReport();
    }
  }, [id, fetch]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/v1/reports/${id}/export`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to export PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Get filename from Content-Disposition if possible
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = `report-${id}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const res = await fetch(`/api/v1/reports/${id}/share`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to generate share link");
      const data = await res.json();
      const fullUrl = `${window.location.origin}${data.share_url}`;
      setShareLink(fullUrl);
      await navigator.clipboard.writeText(fullUrl);
      alert("Share link copied to clipboard!");
    } catch (err) {
      console.error(err);
      alert("Failed to share report. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Decrypting intelligence archives...
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">{error || "Report not found"}</p>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/history")}
        >
          Return to Archives
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto space-y-8 mt-4 pb-20"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => router.push("/dashboard/history")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Archives
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleShare} disabled={isSharing}>
            {isSharing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4 mr-2" />
            )}
            Share
          </Button>
          <Button onClick={handleExportPDF} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Document */}
      <Card className="glow-card gradient-border border-border/30 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-primary/60 via-chart-4/30 to-transparent" />

        {/* Document Header */}
        <div className="px-6 sm:px-10 md:px-14 pt-10 pb-6 border-b border-border/20">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold tracking-wider uppercase text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center">
              <Sparkles className="w-3 h-3 mr-1" />
              {report.domain}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-foreground">
            {report.title ||
              (() => {
                const match = report.content.match(/^##?\s+(.+)/m);
                return match
                  ? match[1].replace(/\*+/g, "").trim()
                  : report.query.split(".")[0];
              })()}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-5 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {format(new Date(report.created_at), "MMMM d, yyyy 'at' h:mm a")}
            </div>
            {report.generation_time_ms && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {(report.generation_time_ms / 1000).toFixed(1)}s generation time
              </div>
            )}
          </div>
        </div>

        {/* Document Body */}
        <CardContent className="px-6 sm:px-10 md:px-14 py-8 md:py-10">
          <NotionMarkdown
            content={report.content.replace(/^##?\s+.*?(?:\n|$)/m, "").trim()}
          />
        </CardContent>
      </Card>

      {/* Sources */}
      {report.sources &&
        report.sources.items &&
        report.sources.items.length > 0 && (
          <Card className="glow-card border-border/30 bg-card/50 backdrop-blur-xl shadow-lg mt-8">
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
  );
}
