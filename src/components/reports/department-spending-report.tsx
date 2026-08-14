"use client";

import { useQuery } from "@tanstack/react-query";
import { GaugeIcon } from "lucide-react";

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
import { formatCurrency } from "@/lib/utils";
import { departmentSpendingQuery } from "@/modules/reports";

/**
 * What each department spent on the requests it raised in the period.
 *
 * Spend is summed from `po-created` request items priced at their material's
 * `last_cost`, so an item whose material synced without one contributes nothing
 * — the totals are spend on priced lines, not on every ordered line. The `po`
 * count is those ordered lines, not a count of distinct purchase orders.
 */

const chartConfig = {
  value: { label: "Total spend", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function DepartmentSpendingReport({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const { data, isPending, error } = useQuery(
    departmentSpendingQuery(startDate, endDate),
  );

  if (isPending) return <TableSkeleton columns={3} />;

  if (error) {
    return <ErrorAlert title="Couldn't load department spend" error={error} />;
  }

  const period = `${formatDate(startDate)} – ${formatDate(endDate)}`;

  // Every department comes back, including the ones that raised nothing.
  const rows = [...data.data].sort((a, b) => b.value - a.value);
  const spending = rows.filter((row) => row.value > 0 || row.po > 0);

  if (spending.length === 0) {
    return (
      <EmptyState
        icon={<GaugeIcon />}
        title="No department spend in this period"
        description="No purchase request in the selected date range reached a purchase order. Try a wider range."
        variant="no-results"
      />
    );
  }

  const chartData = spending.map((row) => ({
    category: row.department,
    value: row.value,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b">
        <CardTitle>Spend by Department — {period}</CardTitle>
        <span className="text-xs text-muted-foreground">
          Total: {formatCurrency(data.total, true)}
        </span>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <ReportBarChart data={chartData} config={chartConfig} currency />
        <p className="text-xs text-muted-foreground">
          Ordered lines priced at each material's last cost. Departments that
          raised nothing in the period are left out.
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
                Ordered Items
              </TableHead>
              <TableHead scope="col" className={`${numericCellClass} pr-4`}>
                Total Spend
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {spending.map((row) => (
              <TableRow key={row.department}>
                <TableCell className={`pl-4 ${cellPrimaryClass}`}>
                  {row.department}
                </TableCell>
                <TableCell className={numericCellClass}>{row.po}</TableCell>
                <TableCell className={`${numericCellClass} pr-4`}>
                  {formatCurrency(row.value, true)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
