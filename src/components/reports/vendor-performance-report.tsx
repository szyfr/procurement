"use client";

import { useQuery } from "@tanstack/react-query";
import { StarIcon } from "lucide-react";

import { ReportBarChart } from "@/components/charts/report-bar-chart";
import { EmptyState, ErrorAlert } from "@/components/shared/query-states";
import {
  cellIdClass,
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
  CHART_VENDOR_LIMIT,
  RATING_MAX,
  type VendorPerformanceRow,
  vendorPerformanceQuery,
} from "@/modules/reports";

/**
 * The date range narrows which vendors are evaluated — upstream matches it
 * against the vendor's own `created_at`, not against delivery dates — so the
 * delivery counts below always cover a vendor's full history.
 */

const chartConfig = {
  value: { label: "On-time delivery", color: "var(--chart-2)" },
} satisfies ChartConfig;

/** Blank names arrive from the sync; the vendor number is the fallback label. */
function vendorLabel(vendor: VendorPerformanceRow) {
  return vendor.name || vendor.no;
}

function truncate(value: string, max = 16) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function VendorPerformanceReport({
  startDate,
  endDate,
  search,
}: {
  startDate: string;
  endDate: string;
  /** Vendor name filter, matched upstream as a case-insensitive substring. */
  search: string;
}) {
  const { data, isPending, error } = useQuery(
    vendorPerformanceQuery(startDate, endDate, search),
  );

  if (isPending) return <TableSkeleton columns={5} />;

  if (error) {
    return (
      <ErrorAlert title="Couldn't load vendor performance" error={error} />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<StarIcon />}
        title={search ? "No matching vendors" : "No vendors in this period"}
        description={
          search
            ? `No vendor matching "${search}" was added within the selected date range.`
            : "No vendor was added within the selected date range. Try a wider range."
        }
        variant="no-results"
      />
    );
  }

  // The busiest vendors, not the highest rated: every vendor with no deliveries
  // sits at a flat 0%, and a chart of those says nothing.
  const chartData = [...data]
    .sort((a, b) => b.total_deliveries - a.total_deliveries)
    .slice(0, CHART_VENDOR_LIMIT)
    .map((vendor) => ({
      category: truncate(vendorLabel(vendor)),
      value: vendor.on_time_percentage,
    }));

  const period = `${formatDate(startDate)} – ${formatDate(endDate)}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b">
        <CardTitle>Vendor Performance — {period}</CardTitle>
        <span className="text-xs text-muted-foreground">
          {data.length === 1 ? "1 vendor" : `${data.length} vendors`} evaluated
        </span>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <ReportBarChart data={chartData} config={chartConfig} unit="%" />
        <p className="text-xs text-muted-foreground">
          {chartData.length < data.length
            ? `On-time delivery for the ${chartData.length} busiest vendors.`
            : "On-time delivery per vendor."}{" "}
          Deliveries cover each vendor's full history; the date range selects
          which vendors are evaluated.
        </p>
      </CardContent>

      <Separator />

      <CardContent className="px-0">
        <Table className={dataTableClass}>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="pl-4">
                Vendor
              </TableHead>
              <TableHead scope="col">Vendor No.</TableHead>
              <TableHead scope="col" className={numericCellClass}>
                Rating
              </TableHead>
              <TableHead scope="col" className={numericCellClass}>
                On-Time
              </TableHead>
              <TableHead scope="col" className={`${numericCellClass} pr-4`}>
                Deliveries
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((vendor) => (
              <TableRow key={vendor._id}>
                <TableCell className="pl-4 font-medium">
                  {vendorLabel(vendor)}
                </TableCell>
                <TableCell className={cellIdClass}>{vendor.no}</TableCell>
                <TableCell className={numericCellClass}>
                  {vendor.rating} / {RATING_MAX}
                </TableCell>
                <TableCell className={numericCellClass}>
                  {formatPercent(vendor.on_time_percentage)}
                </TableCell>
                <TableCell className={`${numericCellClass} pr-4`}>
                  {vendor.on_time_deliveries} / {vendor.total_deliveries}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
