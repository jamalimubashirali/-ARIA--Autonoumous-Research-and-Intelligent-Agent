"use client";

import { useState } from "react";
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

export default function NewResearchPage() {
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState("");
  const [query, setQuery] = useState("");

  const handleStartResearch = async () => {
    // API Call to /api/research will go here
    console.log("Starting research for:", { domain, query });
    setStep(3); // Move to loading state
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 mt-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">New Research</h1>
        <p className="text-muted-foreground">
          Configure your intelligence agent for a new research run.
        </p>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Domain</CardTitle>
            <CardDescription>
              Choose the domain template for your report formatting and analysis
              focus.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Research Domain</Label>
              <Select value={domain} onValueChange={setDomain}>
                <SelectTrigger id="domain">
                  <SelectValue placeholder="Select a domain" />
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
          <CardFooter className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!domain}>
              Next Step
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Research Query</CardTitle>
            <CardDescription>
              Describe in detail what you want the agent to research.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="query">Intelligence Requirement</Label>
              <Textarea
                id="query"
                placeholder="e.g., Provide a comprehensive analysis of the rising agentic AI frameworks in 2026, comparing their architectures and enterprise adoption readiness."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleStartResearch} disabled={!query.trim()}>
              Initialize Agent
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              Agent Executing
            </CardTitle>
            <CardDescription>
              The ARIA orchestrator is currently decomposing your query...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 bg-muted/50 p-6 rounded-md font-mono text-sm max-h-[400px] overflow-y-auto m-6">
            <div className="text-muted-foreground">
              // Real-time event log will stream here
            </div>
            <div>&gt; [Planner] Generating research sub-tasks...</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
