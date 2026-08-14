"use client";

import { ChartNoAxesColumnIcon } from "lucide-react";
import * as React from "react";

import { DepartmentSpendingReport } from "@/components/reports/department-spending-report";
import { PrStatusBreakdownReport } from "@/components/reports/pr-status-breakdown-report";
import { ReportResult } from "@/components/reports/report-result";
import { VendorPerformanceReport } from "@/components/reports/vendor-performance-report";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { defaultReportId, reports } from "@/data/reports";
import { cn } from "@/lib/utils";

/** How long the mock "generating" phase runs before the result appears. */
const GENERATE_DELAY_MS = 900;

/** The reports with a backend behind them; their own queries own their states. */
const LIVE_REPORT_IDS = new Set([
  "vendor-performance",
  "pr-cycle-time",
  "spend-by-department",
]);

/**
 * Report picker plus the generated result. One report is active at a time;
 * generating a mock one shows the loading state before swapping in the result.
 *
 * The live reports skip that staged phase — a real request is already in flight
 * and each panel renders its own pending state. They also re-run on their own
 * when the date range changes, because the dates are part of their query keys.
 */
export function ReportWorkspace({
  startDate,
  endDate,
  search,
}: {
  startDate: string;
  endDate: string;
  search: string;
}) {
  const [activeId, setActiveId] = React.useState(defaultReportId);
  const [generatingId, setGeneratingId] = React.useState<string | null>(null);

  const activeReport = reports.find((report) => report.id === activeId);
  const generatingReport = reports.find((report) => report.id === generatingId);

  React.useEffect(() => {
    if (!generatingId) return;

    const timer = window.setTimeout(() => {
      setActiveId(generatingId);
      setGeneratingId(null);
    }, GENERATE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [generatingId]);

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ChartNoAxesColumnIcon />
              </EmptyMedia>
              <EmptyTitle>No reports available</EmptyTitle>
              <EmptyDescription>
                There are no report types configured yet.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {reports.map((report) => {
          const Icon = report.icon;
          const isActive = report.id === activeId && !generatingId;
          const isGenerating = report.id === generatingId;

          return (
            <Card
              key={report.id}
              className={cn("relative", isActive && "ring-2 ring-primary")}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <Icon className="size-8 rounded-lg border p-1.5 text-muted-foreground" />
                  {isActive ? <Badge>Active</Badge> : null}
                </div>
                <CardTitle>{report.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-end gap-3">
                <p className="text-xs text-muted-foreground">
                  {report.description}
                </p>
                <Button
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  disabled={Boolean(generatingId)}
                  onClick={() =>
                    LIVE_REPORT_IDS.has(report.id)
                      ? setActiveId(report.id)
                      : setGeneratingId(report.id)
                  }
                >
                  {isGenerating ? (
                    <>
                      <Spinner data-icon="inline-start" />
                      Generating
                    </>
                  ) : isActive ? (
                    "Regenerate"
                  ) : (
                    "Generate"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {generatingReport ? (
        <Card aria-live="polite">
          <CardHeader className="flex flex-row items-center justify-between gap-2 border-b">
            <CardTitle>{generatingReport.resultTitle}</CardTitle>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Spinner />
              Generating…
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed bg-accent text-xs text-muted-foreground">
              Crunching PO and evaluation data…
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      ) : activeId === "vendor-performance" ? (
        <VendorPerformanceReport
          startDate={startDate}
          endDate={endDate}
          search={search}
        />
      ) : activeId === "pr-cycle-time" ? (
        <PrStatusBreakdownReport startDate={startDate} endDate={endDate} />
      ) : activeId === "spend-by-department" ? (
        <DepartmentSpendingReport startDate={startDate} endDate={endDate} />
      ) : activeReport ? (
        <ReportResult report={activeReport} />
      ) : null}
    </>
  );
}
