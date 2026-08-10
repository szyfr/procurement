import { SearchXIcon } from "lucide-react";

import { ReportBarChart } from "@/components/charts/report-bar-chart";
import { dataTableClass } from "@/components/shared/table-classes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReportCell, ReportDefinition } from "@/data/reports";
import { cn } from "@/lib/utils";

const toneClasses = {
  success: "text-status-success-fg",
  danger: "text-status-danger-fg",
  muted: "text-muted-foreground",
} as const;

function Cell({ cell }: { cell: ReportCell }) {
  if (typeof cell === "string") {
    return <>{cell}</>;
  }
  return <span className={toneClasses[cell.tone]}>{cell.value}</span>;
}

export function ReportResult({ report }: { report: ReportDefinition }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b">
        <CardTitle>{report.resultTitle}</CardTitle>
        <span className="text-xs text-muted-foreground">{report.summary}</span>
      </CardHeader>

      <CardContent>
        <ReportBarChart
          data={report.chart.data}
          config={report.chart.config}
          unit={report.chart.unit}
          currency={report.chart.currency}
        />
      </CardContent>

      <Separator />

      <CardContent className="px-0">
        {report.table.rows.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon />
              </EmptyMedia>
              <EmptyTitle>No data for this period</EmptyTitle>
              <EmptyDescription>
                Try a different date range or clear the filters.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table className={dataTableClass}>
            <TableHeader>
              <TableRow>
                {report.table.columns.map((column, index) => (
                  <TableHead
                    key={column}
                    scope="col"
                    className={cn(
                      index === 0 && "pl-4",
                      index === report.table.columns.length - 1 && "pr-4",
                    )}
                  >
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.table.rows.map((row) => (
                <TableRow
                  key={typeof row[0] === "string" ? row[0] : row[0].value}
                >
                  {row.map((cell, index) => (
                    <TableCell
                      key={report.table.columns[index]}
                      className={cn(
                        index === 0 && "pl-4",
                        index === row.length - 1 && "pr-4",
                      )}
                    >
                      <Cell cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
