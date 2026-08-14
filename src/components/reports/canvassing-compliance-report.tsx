"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardCheckIcon } from "lucide-react";

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
import { canvassingComplianceQuery } from "@/modules/reports";

/**
 * How the canvassing done in the period measured against the three-quote
 * minimum, per department.
 *
 * The unit is the canvassing request *item*, not the request — `pr_canvassed`
 * sums the items of every matching request, so a request with four items
 * canvassed counts four times. Columns are labelled for items accordingly.
 *
 * Exemptions have no server-side representation, so unlike the wireframe there
 * is no "Exempted" bar or column: anything short of three quotes is below the
 * minimum, including an item with no quotes at all.
 */

const chartConfig = {
  value: { label: "Items", color: "var(--chart-2)" },
} satisfies ChartConfig;

function formatRate(met: number, canvassed: number) {
  if (canvassed === 0) return "—";
  return `${Math.round((met / canvassed) * 100)}%`;
}

export function CanvassingComplianceReport({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const { data, isPending, error } = useQuery(
    canvassingComplianceQuery(startDate, endDate),
  );

  if (isPending) return <TableSkeleton columns={4} />;

  if (error) {
    return (
      <ErrorAlert title="Couldn't load canvassing compliance" error={error} />
    );
  }

  const period = `${formatDate(startDate)} – ${formatDate(endDate)}`;

  // Every department comes back, including the ones that canvassed nothing.
  const rows = [...data]
    .filter((row) => row.pr_canvassed > 0)
    .sort((a, b) => b.pr_canvassed - a.pr_canvassed);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheckIcon />}
        title="No canvassing in this period"
        description="No purchase request created in the selected date range reached canvassing with a quotation against it. Try a wider range."
        variant="no-results"
      />
    );
  }

  const canvassed = rows.reduce((sum, row) => sum + row.pr_canvassed, 0);
  const met = rows.reduce((sum, row) => sum + row.met_minimum, 0);
  const below = rows.reduce((sum, row) => sum + row.below_minimum, 0);

  // Outcome, not category — the one report where bar colour carries meaning,
  // matched to the status tones the pills use everywhere else.
  const chartData = [
    { category: "Met Minimum", value: met, fill: "var(--status-success)" },
    { category: "Below Minimum", value: below, fill: "var(--status-danger)" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b">
        <CardTitle>Canvassing Compliance — {period}</CardTitle>
        <span className="text-xs text-muted-foreground">
          {formatRate(met, canvassed)} met the 3-quote minimum
        </span>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <ReportBarChart data={chartData} config={chartConfig} />
        <p className="text-xs text-muted-foreground">
          Canvassed line items, not requests — a request with several items
          counts once per item. Departments that canvassed nothing in the period
          are left out.
        </p>
      </CardContent>

      <Separator />

      <CardContent className="px-0">
        <Table className={dataTableClass}>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="pl-4">
                Department
              </TableHead>
              <TableHead scope="col" className={numericCellClass}>
                Items Canvassed
              </TableHead>
              <TableHead scope="col" className={numericCellClass}>
                Met Minimum
              </TableHead>
              <TableHead scope="col" className={`${numericCellClass} pr-4`}>
                Below Minimum
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.department}>
                <TableCell className={`pl-4 ${cellPrimaryClass}`}>
                  {row.department}
                </TableCell>
                <TableCell className={numericCellClass}>
                  {row.pr_canvassed}
                </TableCell>
                <TableCell className={numericCellClass}>
                  {row.met_minimum}
                </TableCell>
                <TableCell className={`${numericCellClass} pr-4`}>
                  {row.below_minimum}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
