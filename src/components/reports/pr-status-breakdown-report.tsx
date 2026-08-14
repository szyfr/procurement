"use client";

import { useQuery } from "@tanstack/react-query";
import { ChartPieIcon } from "lucide-react";

import { ReportBarChart } from "@/components/charts/report-bar-chart";
import { EmptyState, ErrorAlert } from "@/components/shared/query-states";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  dataTableClass,
  numericCellClass,
} from "@/components/shared/table-classes";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/date";
import type { StatusTone } from "@/lib/types";
import {
  purchaseRequestStatusLabels,
  purchaseRequestStatusLegend,
  purchaseRequestTone,
} from "@/modules/purchase-requests";
import { type PrStatusCount, prStatusBreakdownQuery } from "@/modules/reports";

/**
 * Where the requests created in the selected period currently sit.
 *
 * The endpoint is named `/reports/pr-cycle`, but it answers a status
 * distribution rather than cycle time — it counts requests per status, and has
 * no per-stage timestamps to measure days from. The card is titled for what the
 * data is; the missing cycle-time source is recorded in the gaps doc.
 */

const chartConfig = {
  value: { label: "Requests", color: "var(--chart-2)" },
} satisfies ChartConfig;

/**
 * The backend titles the status slug itself (`"Po Created"`, `"Pending"`), so
 * its strings are never rendered — they are turned back into a slug and the
 * app's own label and tone are used instead.
 */
function toStatusSlug(category: string) {
  return category.toLowerCase().replace(/ /g, "-");
}

interface StatusRow {
  slug: string;
  label: string;
  tone: StatusTone;
  value: number;
}

/**
 * Rows in lifecycle order rather than the backend's enum order, which is not a
 * display order. A status the app doesn't know keeps the backend's own copy and
 * a neutral tone instead of being dropped.
 */
function toRows(data: PrStatusCount[]): StatusRow[] {
  const counts = new Map(
    data.map((entry) => [toStatusSlug(entry.category), entry.value]),
  );

  const known = purchaseRequestStatusLegend.map(({ status, label }) => ({
    slug: status,
    label,
    tone: purchaseRequestTone[status],
    value: counts.get(status) ?? 0,
  }));

  const unknown = data
    .filter(
      (entry) => !(toStatusSlug(entry.category) in purchaseRequestStatusLabels),
    )
    .map((entry) => ({
      slug: toStatusSlug(entry.category),
      label: entry.category,
      tone: "neutral" as StatusTone,
      value: entry.value,
    }));

  return [...known, ...unknown];
}

export function PrStatusBreakdownReport({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const { data, isPending, error } = useQuery(
    prStatusBreakdownQuery(startDate, endDate),
  );

  if (isPending) return <TableSkeleton columns={2} />;

  if (error) {
    return (
      <ErrorAlert title="Couldn't load the status breakdown" error={error} />
    );
  }

  const rows = toRows(data);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const period = `${formatDate(startDate)} – ${formatDate(endDate)}`;

  if (total === 0) {
    return (
      <EmptyState
        icon={<ChartPieIcon />}
        title="No requests in this period"
        description="No purchase request was created within the selected date range. Try a wider range."
        variant="no-results"
      />
    );
  }

  const chartData = rows.map((row) => ({
    category: row.label,
    value: row.value,
    // Colour carries the status here, the same tones the pills use everywhere
    // else, so a bar and its badge read as the same thing.
    fill: `var(--status-${row.tone})`,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b">
        <CardTitle>PR Status Breakdown — {period}</CardTitle>
        <span className="text-xs text-muted-foreground">
          {total === 1 ? "1 request" : `${total} requests`}
        </span>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <ReportBarChart data={chartData} config={chartConfig} />
        <p className="text-xs text-muted-foreground">
          Requests created in the period, counted by the status they hold now.
        </p>
      </CardContent>

      <Separator />

      <CardContent className="px-0">
        <Table className={dataTableClass}>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="pl-4">
                Status
              </TableHead>
              <TableHead scope="col" className={`${numericCellClass} pr-4`}>
                Requests
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.slug}>
                <TableCell className="pl-4">
                  <StatusBadge tone={row.tone}>{row.label}</StatusBadge>
                </TableCell>
                <TableCell className={`${numericCellClass} pr-4`}>
                  {row.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
