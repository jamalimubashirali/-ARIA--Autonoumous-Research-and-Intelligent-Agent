"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  AlertCircle,
  Activity,
  Terminal,
  Globe,
  Bot,
  ListOrdered,
  Search,
  PenTool,
  Clock,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type LogEvent = {
  id: string;
  timestamp: string;
  source: string;
  message: string;
  type: "info" | "error" | "success" | "warning";
};

function ResearchContent() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  // const [step, setStep] = useState(2); // Removed step state as it's no longer used for local navigation
  const [query, setQuery] = useState("");
  const hasStarted = useRef(false);

  useEffect(() => {
    // Check both sessionStorage (preferred) and searchParams (fallback)
    const qFromParams = searchParams.get("q");
    const qFromStorage = sessionStorage.getItem("pending_research_query");
    const q = qFromStorage || qFromParams;

    if (!q) {
      router.push("/dashboard");
      return;
    }

    setQuery(q);
    if (!hasStarted.current) {
      hasStarted.current = true;
      handleStartResearch(q);
    }
  }, [searchParams, router]);

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

  const handleStartResearch = async (searchQuery: string = query) => {
    // setStep(2);
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
          query: searchQuery,
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
                // Save the report ID for final redirect
                hasStarted.current = data.report_id;
              } else if (
                eventName === "done" ||
                eventName === "agent_run_completed"
              ) {
                addLog(
                  "Research compilation completed successfully. Redirecting to report...",
                  "Orchestrator",
                  "success",
                );
                // Redirect immediately to the report view
                setTimeout(() => {
                  sessionStorage.removeItem("pending_research_query");
                  const reportId =
                    typeof hasStarted.current === "string"
                      ? hasStarted.current
                      : null;
                  if (reportId) {
                    router.push(`/dashboard/reports/${reportId}`);
                  } else {
                    router.push("/dashboard");
                  }
                }, 1000);
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
    <div className="mx-auto space-y-8 mt-4 pb-20 transition-all duration-500 max-w-4xl">
      <div className="flex items-center gap-4 mb-2">
        <Button
          variant="ghost"
          onClick={() => {
            sessionStorage.removeItem("pending_research_query");
            router.push("/dashboard");
          }}
          className="group hover:bg-cyan-500/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Abort Mission
        </Button>
      </div>

      <div className="mb-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center justify-center p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl mb-4 relative group">
          <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full scale-110 group-hover:scale-150 transition-transform duration-700" />
          <Sparkles className="w-8 h-8 text-cyan-600 dark:text-cyan-400 relative z-10" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500">
          Compiling Intelligence
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl text-lg font-medium">
          ARIA is autonomously researching, analyzing, and synthesizing data for
          your request.
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key="step2"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <Card className="border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950/60 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.6)] overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-muted overflow-hidden z-20">
              <div className="h-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-[shimmer_2s_infinite] w-full blur-[1px]"></div>
            </div>
            <CardHeader className="pt-8 bg-background/40 border-b border-border/40 relative z-10">
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
                  <div className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-4 py-1.5 rounded-full text-sm font-bold flex items-center border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative">
              <div className="bg-zinc-50/50 dark:bg-black/40 text-[14px] leading-relaxed h-[500px] overflow-y-auto p-4 sm:p-8 shadow-inner relative z-10 backdrop-blur-md">
                <div className="relative border-l-2 border-border/60 dark:border-white/10 ml-4 py-2 space-y-8">
                  {logs.map((log) => {
                    const isError = log.type === "error";
                    const isSuccess = log.type === "success";

                    let Icon = Terminal;
                    let iconColor = "text-slate-400";
                    let bgColor = "bg-slate-500/10";

                    if (log.source === "Orchestrator") {
                      Icon = Bot;
                      iconColor = "text-blue-400";
                      bgColor = "bg-blue-500/10";
                    } else if (log.source === "Planner") {
                      Icon = ListOrdered;
                      iconColor = "text-cyan-400";
                      bgColor = "bg-cyan-500/10";
                    } else if (log.source === "Researcher") {
                      Icon = Globe;
                      iconColor = "text-amber-400";
                      bgColor = "bg-amber-500/10";
                    } else if (log.source === "Analyst") {
                      Icon = Activity;
                      iconColor = "text-fuchsia-400";
                      bgColor = "bg-fuchsia-500/10";
                    } else if (log.source === "Reviewer") {
                      Icon = Search;
                      iconColor = "text-rose-400";
                      bgColor = "bg-rose-500/10";
                    } else if (log.source === "Writer") {
                      Icon = PenTool;
                      iconColor = "text-emerald-400";
                      bgColor = "bg-emerald-500/10";
                    } else if (log.source === "System") {
                      Icon = Clock;
                    }

                    if (isError) {
                      iconColor = "text-red-400";
                      bgColor = "bg-red-500/10";
                      Icon = AlertCircle;
                    }
                    if (isSuccess) {
                      iconColor = "text-emerald-400";
                      bgColor = "bg-emerald-500/10";
                      Icon = CheckCircle2;
                    }

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={log.id}
                        className="relative pl-8 group/log"
                      >
                        <div
                          className={`absolute -left-[18px] top-0 rounded-full p-2 border border-border/50 dark:border-white/10 ${bgColor} ${iconColor} bg-background ring-[6px] ring-muted/30 dark:ring-black/40 shadow-sm transition-transform duration-300 group-hover/log:scale-110`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col gap-1.5 -mt-1 p-3 rounded-xl hover:bg-muted/40 dark:hover:bg-white/5 transition-colors duration-300 border border-transparent hover:border-border/50">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-foreground tracking-wide text-xs uppercase">
                              {log.source}
                            </span>
                            <span className="text-xs font-mono font-medium text-muted-foreground/70">
                              {log.timestamp}
                            </span>
                          </div>
                          <div
                            className={`text-muted-foreground font-medium text-[15px] ${isError ? "text-red-600 dark:text-red-400 font-bold" : isSuccess ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}`}
                          >
                            {log.message}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={bottomRef} className="h-4" />
                </div>
              </div>
            </CardContent>
            {isError && (
              <CardFooter className="justify-end pt-6 pb-6 px-8 bg-muted/5 border-t border-muted/20">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full"
                  onClick={() => {
                    sessionStorage.removeItem("pending_research_query");
                    router.push("/dashboard");
                  }}
                >
                  Adjust Directives and Retry
                </Button>
              </CardFooter>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function NewResearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      }
    >
      <ResearchContent />
    </Suspense>
  );
}
