"use client";

import { ChartNoAxesColumnIcon, LockIcon } from "lucide-react";

import { CanvassingComplianceReport } from "@/components/reports/canvassing-compliance-report";
import { DepartmentSpendingReport } from "@/components/reports/department-spending-report";
import { PrStatusBreakdownReport } from "@/components/reports/pr-status-breakdown-report";
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
import type { ReportDefinition } from "@/data/reports";
import { cn } from "@/lib/utils";

/**
 * Report picker plus the generated result. One report is active at a time.
 *
 * Every report on the page is backed by a real query that owns its own pending
 * and error states, so selecting one is immediate — there is no staged
 * "generating" phase. There used to be, for the mock reports: a 900ms timer
 * behind a spinner reading "Crunching PO and evaluation data…" that disabled
 * every Generate button while it ran and then revealed static numbers. It
 * simulated work that was not happening.
 *
 * Live reports re-run on their own when the date range changes, because the
 * dates are part of their query keys.
 */
export function ReportWorkspace({
  reports,
  startDate,
  endDate,
  search,
  activeId,
  onActiveIdChange,
}: {
  /** Already narrowed to what this user may run — see `ReportsView`. */
  reports: readonly ReportDefinition[];
  startDate: string;
  endDate: string;
  search: string;
  activeId: string;
  onActiveIdChange: (id: string) => void;
}) {
  const activeReport = reports.find((report) => report.id === activeId);

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
                There are no report types you can generate.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* The widest breakpoint lays every card out in one row, so the column
          count follows how many are actually visible. */}
      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
          reports.length >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4",
        )}
      >
        {reports.map((report) => {
          const Icon = report.icon;
          const isActive = report.id === activeId;
          const isLive = report.availability === "live";

          return (
            <Card
              key={report.id}
              className={cn("relative", isActive && "ring-2 ring-primary")}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <Icon className="size-8 rounded-lg border p-1.5 text-muted-foreground" />
                  {isActive ? (
                    <Badge>Active</Badge>
                  ) : isLive ? null : (
                    <Badge variant="outline">Unavailable</Badge>
                  )}
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
                  onClick={() => onActiveIdChange(report.id)}
                >
                  {isActive ? "Regenerate" : "Generate"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {activeId === "vendor-performance" ? (
        <VendorPerformanceReport
          startDate={startDate}
          endDate={endDate}
          search={search}
        />
      ) : activeId === "pr-cycle-time" ? (
        <PrStatusBreakdownReport startDate={startDate} endDate={endDate} />
      ) : activeId === "spend-by-department" ? (
        <DepartmentSpendingReport startDate={startDate} endDate={endDate} />
      ) : activeId === "canvassing-compliance" ? (
        <CanvassingComplianceReport startDate={startDate} endDate={endDate} />
      ) : activeReport ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{activeReport.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Empty className="gap-0 px-8 py-14">
              <EmptyHeader className="max-w-none gap-2">
                <EmptyMedia
                  variant="icon"
                  className="mb-4 size-11 rounded-xl [&_svg:not([class*='size-'])]:size-[22px]"
                >
                  <LockIcon />
                </EmptyMedia>
                <EmptyTitle className="text-base font-bold">
                  Not available yet
                </EmptyTitle>
                <EmptyDescription className="max-w-[420px] text-[13px] leading-normal">
                  {activeReport.unavailableReason ??
                    "This report has no data source yet."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
