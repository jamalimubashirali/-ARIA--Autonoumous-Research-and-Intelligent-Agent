"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, FileText, Zap } from "lucide-react";
import { useApiClient } from "@/lib/api";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your research activity and usage.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Reports Generated
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {usage?.reports_this_month || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Reports generated this month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold capitalize">
                  {usage?.plan || "Free"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {usage?.reports_limit === -1 ||
                  usage?.reports_limit === undefined
                    ? "Unlimited reports"
                    : `${usage?.reports_limit} reports / month`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Agent Runs
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">All systems idle</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
