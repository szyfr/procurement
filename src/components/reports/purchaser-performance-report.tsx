"use client";

import { useQuery } from "@tanstack/react-query";
import { UserCheckIcon } from "lucide-react";

import { ReportBarChart } from "@/components/charts/report-bar-chart";
import { EmptyState, ErrorAlert } from "@/components/shared/query-states";
import {
  cellPrimaryClass,
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
import {
  CHART_PURCHASER_LIMIT,
  type PurchaserAssessmentRow,
  purchaserAssessmentQuery,
} from "@/modules/reports";

/**
 * What each purchaser handled in the period and how much of it landed on time.
 *
 * The unit is the purchase request *item*, not the request — `PRs Processed`
 * sums the items of every delivery proof the purchaser filed, so a proof
 * covering four items counts four times. Columns are labelled for items
 * accordingly.
 *
 * There is no cycle time here. The endpoint returns three fields and none of
 * them is a duration, so the wireframe's cycle-time column is absent rather
 * than filled with something derived.
 */

const chartConfig = {
  value: { label: "On-time delivery", color: "var(--chart-2)" },
} satisfies ChartConfig;

/** `$concat` yields null upstream when a user is missing either name half. */
function purchaserLabel(row: PurchaserAssessmentRow) {
  return row.Purchaser?.trim() || "Unnamed purchaser";
}

function truncate(value: string, max = 16) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function PurchaserPerformanceReport({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const { data, isPending, error } = useQuery(
    purchaserAssessmentQuery(startDate, endDate),
  );

  if (isPending) return <TableSkeleton columns={3} />;

  if (error) {
    return (
      <ErrorAlert title="Couldn't load purchaser performance" error={error} />
    );
  }

  const period = `${formatDate(startDate)} – ${formatDate(endDate)}`;

  // The range filters the items, not the proofs, so a purchaser whose work all
  // falls outside it still comes back — at zero items and a zero percentage
  // that would read as 0% on time rather than "nothing here".
  const rows = [...data]
    .filter((row) => row["PRs Processed"] > 0)
    .sort((a, b) => b["PRs Processed"] - a["PRs Processed"]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<UserCheckIcon />}
        title="No purchasing activity in this period"
        description="No delivery proof covers a request item created within the selected date range. Try a wider range."
        variant="no-results"
      />
    );
  }

  // Weighted by items rather than averaged across purchasers: accuracy is a
  // share of items upstream, so one item at 100% must not weigh as much as
  // forty at 90%.
  const totalItems = rows.reduce((sum, row) => sum + row["PRs Processed"], 0);
  const weightedAccuracy =
    rows.reduce(
      (sum, row) => sum + row["Delivery Accuracy"] * row["PRs Processed"],
      0,
    ) / totalItems;

  // The busiest purchasers, not the most accurate: a purchaser with a single
  // item sits at a flat 100% and would top a chart sorted by percentage.
  const chartData = rows.slice(0, CHART_PURCHASER_LIMIT).map((row) => ({
    category: truncate(purchaserLabel(row)),
    value: row["Delivery Accuracy"],
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b">
        <CardTitle>Purchaser Performance — {period}</CardTitle>
        <span className="text-xs text-muted-foreground">
          {formatPercent(weightedAccuracy)} of {totalItems} items on time
        </span>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <ReportBarChart data={chartData} config={chartConfig} unit="%" />
        <p className="text-xs text-muted-foreground">
          Request line items, not requests — a delivery proof covering several
          items counts once per item. An item is on time when it was delivered
          on or before the proof's delivery date; one with no delivery recorded
          against it yet still counts as on time upstream.
        </p>
      </CardContent>

      <Separator />

      <CardContent className="px-0">
        <Table className={dataTableClass}>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="pl-4">
                Purchaser
              </TableHead>
              <TableHead scope="col" className={numericCellClass}>
                Items Processed
              </TableHead>
              <TableHead scope="col" className={`${numericCellClass} pr-4`}>
                Delivery Accuracy
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* The row carries no id — `_id` is projected out upstream — and
                two purchasers can share a name, so the position is the key. */}
            {rows.map((row, index) => (
              <TableRow key={`${row.Purchaser ?? "unnamed"}-${index}`}>
                <TableCell className={`pl-4 ${cellPrimaryClass}`}>
                  {purchaserLabel(row)}
                </TableCell>
                <TableCell className={numericCellClass}>
                  {row["PRs Processed"]}
                </TableCell>
                <TableCell className={`${numericCellClass} pr-4`}>
                  {formatPercent(row["Delivery Accuracy"])}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
