"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence, Variants } from "framer-motion";
import NotionMarkdown from "@/components/notion-markdown";
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  AlertCircle,
  History,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type LogEvent = {
  id: string;
  timestamp: string;
  source: string;
  message: string;
  type: "info" | "error" | "success" | "warning";
};

export default function NewResearchPage() {
  const { getToken } = useAuth();
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll logs
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const addLog = (
    message: string,
    source: string = "System",
    type: LogEvent["type"] = "info",
  ) => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toLocaleTimeString(),
        source,
        message,
        type,
      },
    ]);
  };

  const handleStartResearch = async () => {
    setStep(2);
    setLogs([]);
    setFinalReport(null);
    setIsError(false);

    addLog("Initializing ARIA Orchestrator...", "Orchestrator");

    try {
      const token = await getToken();
      if (!token) {
        addLog("Authentication failed. Please log in again.", "Auth", "error");
        setIsError(true);
        return;
      }

      // We cannot use standard fetch for SSE, we need EventSource or a custom stream reader.
      // Since we need to pass Authorization headers, EventSource API doesn't work out of the box.
      // We will use fetch and read the Response body stream.

      const response = await fetch(`${API_BASE_URL}/api/v1/research`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          domain: "",
        }),
      });

      if (!response.ok || !response.body) {
        let errorMsg = `Server returned ${response.status}`;
        try {
          const errData = await response.json();
          errorMsg = errData.detail || errorMsg;
        } catch (e) {}
        addLog(`Failed to start task: ${errorMsg}`, "System", "error");
        setIsError(true);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages split by double newline
        const events = buffer.split("\n\n");
        // Keep the last partial event in the buffer
        buffer = events.pop() || "";

        for (const eventStr of events) {
          if (!eventStr.trim()) continue;

          // Parse SSE format:
          // event: event_type
          // data: {"json": "payload"}
          const lines = eventStr.split("\n");
          let eventType = "message";
          let eventData = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.substring(7).trim();
            } else if (line.startsWith("data: ")) {
              eventData = line.substring(6).trim();
            }
          }

          if (eventData) {
            try {
              const parsed = JSON.parse(eventData);
              const eventName = parsed.event || eventType;
              const data = parsed.data || parsed;

              if (
                eventName === "node_complete" ||
                eventName === "agent_node_event"
              ) {
                const nodeNameStr = data.node || "System";
                // Skip noisy planner events from the user-facing log
                if (nodeNameStr === "planner") continue;
                const nodeName =
                  nodeNameStr.charAt(0).toUpperCase() + nodeNameStr.slice(1);
                const friendlyMessages: Record<string, string> = {
                  researcher: "Gathering intelligence from web sources...",
                  analyst: "Analyzing and cross-referencing data...",
                  writer: "Composing the intelligence report...",
                  reviewer: "Quality assurance review in progress...",
                };
                const msg = friendlyMessages[nodeNameStr] || "Processing...";
                addLog(msg, nodeName);
              } else if (eventName === "report") {
                setFinalReport(
                  typeof data.report === "string" ? data.report : data.content,
                );
              } else if (eventName === "saved") {
                addLog(
                  `Report saved to archives (ID: ${data.report_id})`,
                  "System",
                  "success",
                );
              } else if (
                eventName === "done" ||
                eventName === "agent_run_completed"
              ) {
                addLog(
                  "Research compilation completed successfully.",
                  "Orchestrator",
                  "success",
                );
                setStep(3); // Move to results view
              } else if (eventName === "error") {
                addLog(data.message || "An error occurred.", "System", "error");
                setIsError(true);
              } else if (eventName === "agent_auth_error") {
                addLog("Authentication failed during stream.", "Auth", "error");
                setIsError(true);
              } else if (eventName === "agent_billing_error") {
                addLog(
                  "Usage limit reached. Please upgrade your plan.",
                  "Billing",
                  "error",
                );
                setIsError(true);
              } else if (eventName === "warning") {
                addLog(data.message || "Warning", "System", "warning");
              } else {
                addLog(`System Event: ${JSON.stringify(data)}`, "System");
              }
            } catch (err) {
              console.error("Failed to parse SSE data", err, eventData);
            }
          }
        }
      }
    } catch (err) {
      console.error("Stream error:", err);
      addLog(
        `Connection error: ${err instanceof Error ? err.message : "Unknown"}`,
        "System",
        "error",
      );
      setIsError(true);
    }
  };

  const pageVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  return (
    <div
      className={`mx-auto space-y-8 mt-8 pb-20 transition-all duration-500 ${step === 3 ? "max-w-6xl" : "max-w-4xl"}`}
    >
      {step !== 3 && (
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
            Intelligence Request
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-lg">
            Configure ARIA to autonomously research, analyze, and synthesize
            data across your target domain.
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Card className="border-muted bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/50" />
              <CardHeader className="pt-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    1
                  </div>
                  <CardTitle className="text-2xl">Define Directive</CardTitle>
                </div>
                <CardDescription className="text-base ml-14">
                  Precisely specify your research objectives. The orchestration
                  engine will adapt its strategy based on your prompt.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 ml-14">
                <div className="space-y-3">
                  <Textarea
                    id="query"
                    placeholder="e.g., Provide a comprehensive analysis of the rising agentic AI frameworks in 2026, comparing their architectures, limitations, and enterprise adoption readiness."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-[220px] resize-none text-base p-5 bg-background/50 rounded-xl border-muted-foreground/20 focus-visible:ring-primary/50 transition-all shadow-inner"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-6 pb-8 px-8 mt-4 bg-muted/5 border-t border-muted/20">
                <Button
                  onClick={handleStartResearch}
                  disabled={!query.trim()}
                  size="lg"
                  className="px-8 rounded-full shadow-lg hover:shadow-primary/25 bg-gradient-to-r from-primary to-primary/80 hover:to-primary/90 transition-all active:scale-95 text-base h-12"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Deploy Agents
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Card className="border-primary/30 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-muted overflow-hidden">
                <div className="h-full bg-primary animate-pulse w-full"></div>
              </div>
              <CardHeader className="pt-8 bg-muted/5 border-b border-muted/20">
                <CardTitle className="text-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {isError ? (
                      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-destructive" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40"></span>
                        <Sparkles className="w-6 h-6 text-primary relative z-10" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span>
                        {isError ? "Mission Aborted" : "Swarm Executing"}
                      </span>
                      <span className="text-sm font-normal text-muted-foreground mt-1">
                        {isError
                          ? "An error occurred during orchestration."
                          : "Agents are actively gathering and synthesizing data."}
                      </span>
                    </div>
                  </div>
                  {!isError && (
                    <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 relative">
                <div className="absolute inset-0 bg-grid-white/5 bg-[size:20px_20px] pointer-events-none opacity-20" />
                <div className="bg-[#0A0A0A] font-mono text-[13px] leading-relaxed h-[450px] overflow-y-auto p-6 space-y-3 shadow-inner relative z-10">
                  {logs.map((log) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={log.id}
                      className="flex gap-4 items-start break-words border-b border-white/5 pb-3 last:border-0 last:pb-0"
                    >
                      <span className="text-slate-600 shrink-0 w-24">
                        [{log.timestamp}]
                      </span>
                      <span
                        className={`shrink-0 font-semibold w-28 uppercase tracking-wider text-xs mt-0.5 ${
                          log.source === "Orchestrator"
                            ? "text-blue-500"
                            : log.source === "Planner"
                              ? "text-cyan-400"
                              : log.source === "Researcher"
                                ? "text-amber-400"
                                : log.source === "Analyst"
                                  ? "text-fuchsia-400"
                                  : log.source === "Reviewer"
                                    ? "text-rose-400"
                                    : log.source === "Writer"
                                      ? "text-emerald-400"
                                      : log.source === "System"
                                        ? "text-slate-400"
                                        : "text-slate-400"
                        }`}
                      >
                        [ {log.source} ]
                      </span>
                      <span
                        className={`flex-1 ${
                          log.type === "error"
                            ? "text-red-400 font-semibold"
                            : log.type === "success"
                              ? "text-emerald-400 font-medium"
                              : log.type === "warning"
                                ? "text-amber-300"
                                : "text-slate-300"
                        }`}
                      >
                        {log.message}
                      </span>
                    </motion.div>
                  ))}
                  <div ref={bottomRef} className="h-4" />
                </div>
              </CardContent>
              {isError && (
                <CardFooter className="justify-end pt-6 pb-6 px-8 bg-muted/5 border-t border-muted/20">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full"
                    onClick={() => setStep(1)}
                  >
                    Review Directives and Retry
                  </Button>
                </CardFooter>
              )}
            </Card>
          </motion.div>
        )}

        {step === 3 && finalReport && (
          <motion.div
            key="step3"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            {/* Success Banner */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                Intelligence report compiled successfully
              </p>
            </motion.div>

            {/* Document Container */}
            <Card className="border-border/40 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
              {/* Subtle top accent */}
              <div className="h-[3px] bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />

              {/* Document Header */}
              <div className="px-6 sm:px-10 md:px-14 pt-10 pb-6 border-b border-border/20">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold tracking-wider uppercase text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Generated Insight
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
                  {(() => {
                    const match = finalReport.match(/^##?\s+(.+)/m);
                    return match ? match[1].replace(/\*+/g, "").trim() : query;
                  })()}
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Generated by ARIA Autonomous Research Agents
                </p>
              </div>

              {/* Document Body */}
              <CardContent className="px-6 sm:px-10 md:px-14 py-8 md:py-10">
                <NotionMarkdown
                  content={finalReport
                    .replace(/^##?\s+.*?(?:\n|$)/m, "")
                    .trim()}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto rounded-full px-8 hover:bg-primary/5"
                onClick={() => (window.location.href = "/dashboard/history")}
              >
                <History className="w-4 h-4 mr-2" />
                View in Archives
              </Button>
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-full px-8 bg-gradient-to-r from-primary to-primary/80 hover:to-primary/90 shadow-lg hover:shadow-primary/25 transition-all"
                onClick={() => {
                  setStep(1);
                  setQuery("");
                  setFinalReport(null);
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                New Mission
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
