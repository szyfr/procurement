"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheckIcon,
  CircleCheckBigIcon,
  ClipboardListIcon,
} from "lucide-react";
import Link from "next/link";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { type KpiCardData, KpiCards } from "@/components/dashboard/kpi-cards";
import { useCan } from "@/components/providers/permissions-provider";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { ErrorAlert } from "@/components/shared/query-states";
import { StatusBadge } from "@/components/shared/status-badge";
import { dataTableClass } from "@/components/shared/table-classes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { canvassingListQuery } from "@/modules/canvassing";
import {
  purchaseRequestListQuery,
  purchaseRequestStatusLabels,
  purchaseRequestTone,
} from "@/modules/purchase-requests";

/**
 * The dashboard body, fetched from the BFF in the browser via TanStack Query.
 *
 * Each section runs its own query so one failing endpoint doesn't blank the
 * rest of the page. There is no dashboard/stats/summary/activity/delivery
 * endpoint on the backend today — only `/purchase-requests` (filterable by
 * `pr_status`) and `/canvassing` have real data, so those are the only two
 * sections wired here. See `DASHBOARD_BACKEND_GAPS.md` for what's missing.
 *
 * Those two reads are separately permissioned, and this is where sign-in lands,
 * so each is disabled rather than left to 403: a user with neither still gets a
 * page, with the tiles reading "—" the way the never-backed ones already do.
 */
/** Panel-sized stand-in for a section this user isn't permitted to read. */
function NoAccessNote({ resource }: { resource: string }) {
  return (
    <p className="px-4 py-6 text-center text-xs text-muted-foreground">
      You don&apos;t have permission to view {resource}.
    </p>
  );
}

export function DashboardView() {
  const canViewRequests = useCan(PERMISSIONS.purchaseRequest.index);
  const canViewCanvassing = useCan(PERMISSIONS.canvassing.index);

  // Only `pagination.total_items` is read from these two, so pageSize stays
  // at 1 to keep the payload minimal.
  const pendingCount = useQuery({
    ...purchaseRequestListQuery(1, { status: ["pending"], pageSize: 1 }),
    enabled: canViewRequests,
  });
  const partialCount = useQuery({
    ...purchaseRequestListQuery(1, {
      status: ["partially-completed"],
      pageSize: 1,
    }),
    enabled: canViewRequests,
  });
  const actionable = useQuery({
    ...purchaseRequestListQuery(1, {
      status: ["pending", "canvassing", "po-created", "partially-completed"],
      pageSize: 6,
    }),
    enabled: canViewRequests,
  });
  // Shared by the Pending Quotations KPI tile and the widget below — one
  // fetch, not two.
  const canvassing = useQuery({
    ...canvassingListQuery(1),
    enabled: canViewCanvassing,
  });

  const kpiItems: KpiCardData[] = [
    {
      id: "pending-prs",
      label: "Pending Purchase Requests",
      value:
        !canViewRequests || pendingCount.isError
          ? "—"
          : (pendingCount.data?.pagination.total_items ?? 0),
      isPending: canViewRequests && pendingCount.isPending,
    },
    // No per-user assignment concept exists on the backend, so there's no
    // way to scope this to the signed-in user's own action items.
    { id: "your-action", label: "Requiring Your Action", value: "—" },
    {
      id: "pending-quotes",
      label: "Pending Quotations",
      // Counts every item currently in canvassing, including ones with a
      // vendor already selected pending award — the backend has no finer
      // filter than that.
      value:
        !canViewCanvassing || canvassing.isError
          ? "—"
          : (canvassing.data?.pagination.total_items ?? 0),
      isPending: canViewCanvassing && canvassing.isPending,
    },
    {
      id: "partial-prs",
      label: "Partially Completed PRs",
      value:
        !canViewRequests || partialCount.isError
          ? "—"
          : (partialCount.data?.pagination.total_items ?? 0),
      isPending: canViewRequests && partialCount.isPending,
    },
    // No delivery/PO entity exists on the backend.
    { id: "overdue", label: "Overdue Deliveries", value: "—" },
  ];

  return (
    <>
      <KpiCards items={kpiItems} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 border-b">
              <CardTitle>Requests Requiring Action</CardTitle>
              {actionable.data ? (
                <span className="text-xs text-muted-foreground">
                  {actionable.data.pagination.total_items} items
                </span>
              ) : null}
            </CardHeader>
            <CardContent className="px-0">
              {!canViewRequests ? (
                <NoAccessNote resource="purchase requests" />
              ) : actionable.isError ? (
                <div className="p-4">
                  <ErrorAlert
                    title="Couldn't load requests requiring action"
                    error={actionable.error}
                  />
                </div>
              ) : actionable.isPending ? (
                <Table className={dataTableClass}>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">PR No.</TableHead>
                      <TableHead scope="col">Requester</TableHead>
                      <TableHead scope="col">Department</TableHead>
                      <TableHead scope="col">Amount</TableHead>
                      <TableHead scope="col">Step</TableHead>
                      <TableHead scope="col">Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 6 }, (_, row) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder rows
                      <TableRow key={row}>
                        {Array.from({ length: 6 }, (_, column) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder columns
                          <TableCell key={column}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : actionable.data.data.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia
                      variant="icon"
                      className="mb-4 size-11 rounded-xl [&_svg:not([class*='size-'])]:size-[22px]"
                    >
                      <CircleCheckBigIcon />
                    </EmptyMedia>
                    <EmptyTitle className="text-base font-bold">
                      Nothing needs your attention
                    </EmptyTitle>
                    <EmptyDescription className="max-w-[400px] text-[13px] leading-normal">
                      All caught up — no purchase requests are waiting on you
                      right now.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table className={dataTableClass}>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">PR No.</TableHead>
                      <TableHead scope="col">Requester</TableHead>
                      <TableHead scope="col">Department</TableHead>
                      <TableHead scope="col">Amount</TableHead>
                      <TableHead scope="col">Step</TableHead>
                      <TableHead scope="col">Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actionable.data.data.map((request) => (
                      <TableRow key={request._id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/purchase-requests/${request._id}`}
                            className="hover:underline"
                          >
                            {request.no}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {request.requester_name || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {request.department_name || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        {/* No amount is stored on a request and materials
                            sync without a cost, so there is nothing to show. */}
                        <TableCell>
                          <span
                            className="text-muted-foreground"
                            title="No estimated amount on file"
                          >
                            —
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            tone={purchaseRequestTone[request.status]}
                          >
                            {purchaseRequestStatusLabels[request.status]}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={request.priority} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {/* No audit/activity log endpoint exists on the backend;
                  always empty until one does. */}
              <ActivityFeed entries={[]} />
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Pending Quotations</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {!canViewCanvassing ? (
                <NoAccessNote resource="canvassing" />
              ) : canvassing.isError ? (
                <div className="p-4">
                  <ErrorAlert
                    title="Couldn't load pending quotations"
                    error={canvassing.error}
                  />
                </div>
              ) : canvassing.isPending ? (
                <div className="flex flex-col gap-3 p-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : canvassing.data.data.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia
                      variant="icon"
                      className="mb-4 size-11 rounded-xl [&_svg:not([class*='size-'])]:size-[22px]"
                    >
                      <ClipboardListIcon />
                    </EmptyMedia>
                    <EmptyTitle className="text-base font-bold">
                      No pending quotations
                    </EmptyTitle>
                    <EmptyDescription className="max-w-[400px] text-[13px] leading-normal">
                      Nothing is currently awaiting vendor quotes.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul className="divide-y">
                  {canvassing.data.data.slice(0, 4).map((entry) => (
                    <li
                      key={entry._id}
                      className="flex flex-col gap-0.5 px-4 py-3"
                    >
                      <Link
                        href="/canvassing"
                        className="text-sm hover:underline"
                      >
                        {entry.purchase_request?.no ?? "Unknown PR"} ·{" "}
                        {entry.material?.description ?? entry.material_id}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {entry.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {/* No delivery/PO entity exists on the backend; always empty
                  until one does. */}
              <Empty>
                <EmptyHeader>
                  <EmptyMedia
                    variant="icon"
                    className="mb-4 size-11 rounded-xl [&_svg:not([class*='size-'])]:size-[22px]"
                  >
                    <CalendarCheckIcon />
                  </EmptyMedia>
                  <EmptyTitle className="text-base font-bold">
                    No upcoming deadlines
                  </EmptyTitle>
                  <EmptyDescription className="max-w-[400px] text-[13px] leading-normal">
                    Nothing is due soon.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
