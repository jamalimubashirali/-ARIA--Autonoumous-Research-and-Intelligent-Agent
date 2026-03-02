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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence, Variants } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2, Loader2, Sparkles, AlertCircle } from "lucide-react";
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
  const [domain, setDomain] = useState("");
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
    setStep(3);
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
          domain,
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
              const data = JSON.parse(eventData);

              if (eventType === "agent_node_event") {
                const nodeName =
                  data.node.charAt(0).toUpperCase() + data.node.slice(1);
                addLog(
                  `Executing: ${Object.keys(data.state_updates).join(", ")}`,
                  nodeName,
                );
              } else if (eventType === "agent_run_completed") {
                addLog(
                  "Research compilation completed successfully.",
                  "Orchestrator",
                  "success",
                );
                if (data.report) {
                  setFinalReport(data.report.content);
                  setStep(4); // Move to results view
                }
              } else if (eventType === "agent_auth_error") {
                addLog("Authentication failed during stream.", "Auth", "error");
                setIsError(true);
              } else if (eventType === "agent_billing_error") {
                addLog(
                  "Usage limit reached. Please upgrade your plan.",
                  "Billing",
                  "error",
                );
                setIsError(true);
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
    <div className="max-w-4xl mx-auto space-y-8 mt-8 pb-20">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
          Intelligence Request
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl text-lg">
          Configure ARIA to autonomously research, analyze, and synthesize data
          across your target domain.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Card className="border-muted bg-card/60 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">1. Select Domain</CardTitle>
                <CardDescription>
                  Choose the specialized intelligence domain for your report to
                  guide the agent's sourcing strategy.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="domain" className="text-sm font-semibold">
                    Intelligence Envelope
                  </Label>
                  <Select value={domain} onValueChange={setDomain}>
                    <SelectTrigger
                      id="domain"
                      className="h-12 bg-background/50 text-base"
                    >
                      <SelectValue placeholder="Select a targeted domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">
                        Sales & B2B Intelligence
                      </SelectItem>
                      <SelectItem value="finance">Finance & Markets</SelectItem>
                      <SelectItem value="healthcare">
                        Healthcare & Biotech
                      </SelectItem>
                      <SelectItem value="legal">Legal & Compliance</SelectItem>
                      <SelectItem value="sports">Sports & Athletics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-6 border-t border-muted/50">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!domain}
                  size="lg"
                  className="px-8 shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  Continue
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
            <Card className="border-muted bg-card/60 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">2. Define Requirement</CardTitle>
                <CardDescription>
                  Provide a detailed description of what you want the agent to
                  investigate. The more specific, the better the final
                  synthesis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="query" className="text-sm font-semibold">
                    Directives
                  </Label>
                  <Textarea
                    id="query"
                    placeholder="e.g., Provide a comprehensive analysis of the rising agentic AI frameworks in 2026, comparing their architectures, limitations, and enterprise adoption readiness."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-[200px] resize-none text-base p-4 bg-background/50 focus-visible:ring-primary/50"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-6 border-t border-muted/50">
                <Button variant="ghost" onClick={() => setStep(1)} size="lg">
                  Back
                </Button>
                <Button
                  onClick={handleStartResearch}
                  disabled={!query.trim()}
                  size="lg"
                  className="px-8 shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Initialize Run
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Card className="border-primary/50 bg-card/60 backdrop-blur-xl shadow-2xl shadow-primary/5 overflow-hidden">
              <div className="h-1 w-full bg-muted overflow-hidden">
                <div className="h-full bg-primary animate-pulse w-full"></div>
              </div>
              <CardHeader className="bg-muted/10">
                <CardTitle className="text-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isError ? (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    ) : (
                      <span className="relative flex h-3 w-3 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                      </span>
                    )}
                    <span>
                      {isError ? "Agent Terminated" : "Agent Executing"}
                    </span>
                  </div>
                  {!isError && (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  )}
                </CardTitle>
                <CardDescription>
                  ARIA orchestrated swarm is currently processing your request.
                  Please wait, this may take a few minutes for complex queries.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-slate-950 text-slate-300 font-mono text-xs sm:text-sm h-[400px] overflow-y-auto p-6 space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex gap-4 items-start break-words border-b border-white/5 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-slate-500 shrink-0 w-20">
                        [{log.timestamp}]
                      </span>
                      <span
                        className={`shrink-0 font-semibold w-24 ${
                          log.source === "Orchestrator"
                            ? "text-primary"
                            : log.source === "Planner"
                              ? "text-blue-400"
                              : log.source === "Researcher"
                                ? "text-yellow-400"
                                : log.source === "Analyst"
                                  ? "text-purple-400"
                                  : log.source === "Reviewer"
                                    ? "text-red-400"
                                    : log.source === "Writer"
                                      ? "text-green-400"
                                      : "text-slate-400"
                        }`}
                      >
                        [{log.source}]
                      </span>
                      <span
                        className={`flex-1 ${
                          log.type === "error"
                            ? "text-destructive font-semibold"
                            : log.type === "success"
                              ? "text-green-400 font-semibold"
                              : ""
                        }`}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                  <div ref={bottomRef} className="h-1" />
                </div>
              </CardContent>
              {isError && (
                <CardFooter className="justify-end pt-4 bg-muted/10">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Review Constraints and Retry
                  </Button>
                </CardFooter>
              )}
            </Card>
          </motion.div>
        )}

        {step === 4 && finalReport && (
          <motion.div
            key="step4"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Card className="border-green-500/50 bg-card/60 backdrop-blur-xl shadow-2xl">
              <CardHeader className="border-b border-muted/50 bg-green-500/5 items-center text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <CardTitle className="text-2xl">Mission Accomplished</CardTitle>
                <CardDescription className="text-base text-foreground mt-2">
                  The agent swarm has successfully generated your intelligence
                  report.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-center prose-a:text-primary">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {finalReport}
                </ReactMarkdown>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-muted/50 p-6 bg-muted/10">
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/dashboard/history")}
                >
                  View History
                </Button>
                <Button
                  onClick={() => {
                    setStep(1);
                    setDomain("");
                    setQuery("");
                    setFinalReport(null);
                  }}
                >
                  New Mission
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
