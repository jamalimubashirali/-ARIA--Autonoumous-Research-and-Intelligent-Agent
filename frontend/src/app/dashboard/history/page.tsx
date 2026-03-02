import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function HistoryPage() {
  // Placeholder for fetching reports from Supabase
  const reports = [
    {
      id: "1",
      title: "Market Analysis on AI Agents",
      domain: "technology",
      date: "2026-03-01",
      status: "completed",
    },
    {
      id: "2",
      title: "Competitor Analysis for Stripe",
      domain: "finance",
      date: "2026-02-28",
      status: "completed",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report History</h1>
        <p className="text-muted-foreground">
          View and export your previously generated intelligence reports.
        </p>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-xl">{report.title}</CardTitle>
                <CardDescription>
                  Generated on {report.date} • Domain: {report.domain}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                View Report
              </Button>
            </CardHeader>
          </Card>
        ))}
        {reports.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No reports generated yet.
          </div>
        )}
      </div>
    </div>
  );
}
