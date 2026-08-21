"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import * as React from "react";
import { useCan } from "@/components/providers/permissions-provider";
import { CancelPurchaseRequestDialog } from "@/components/purchase-requests/cancel-pr-dialog";
import { CompletePurchaseRequestDialog } from "@/components/purchase-requests/complete-pr-dialog";
import { PurchaseRequestActionPanel } from "@/components/purchase-requests/pr-action-panel";
import { PurchaseRequestDetailsPanel } from "@/components/purchase-requests/pr-details-panel";
import { PurchaseRequestItemsSection } from "@/components/purchase-requests/pr-items-section";
import { PurchaseRequestProofsSection } from "@/components/purchase-requests/pr-proofs-section";
import { PurchaseRequestStepper } from "@/components/purchase-requests/pr-stepper";
import { PageHeader } from "@/components/shared/page-header";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { ErrorAlert } from "@/components/shared/query-states";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { formatShortDate } from "@/lib/date";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import {
  type PurchaseRequestDetail,
  purchaseRequestDetailQuery,
  purchaseRequestKeys,
  purchaseRequestStatusLabels,
  purchaseRequestTone,
  setPurchaseRequestStatus,
  usePurchaseRequestUpdates,
} from "@/modules/purchase-requests";

/**
 * Purchase request detail, fetched from the BFF in the browser via TanStack
 * Query.
 *
 * Several panels the wireframe shows have no backend behind them yet —
 * documents, comments, activity history and the action panel. They already
 * render conditionally, so they simply stay hidden rather than being filled
 * with placeholder content.
 */

/** Summary line under the title, assembled from whatever the backend gave us. */
function metaLine(request: PurchaseRequestDetail) {
  // The detail response joins no requester, so that part is always absent
  // here; the department arrives as a whole document rather than a name.
  const parts = [request.requester_name, request.department?.title].filter(
    (part): part is string => Boolean(part),
  );

  // No submitted/completed/rejected timestamps are stored, so the created date
  // is the only point in the request's history we can show.
  const created = formatShortDate(request.created_at);
  if (created) parts.push(`Created ${created}`);

  // No amount is stored and no item cost is available to derive one.
  parts.push(
    `Amount unavailable (${request.items.length} ${
      request.items.length === 1 ? "item" : "items"
    })`,
  );

  return parts.join(" · ");
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-64 w-full lg:col-span-2" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export function PurchaseRequestDetailView({ id }: { id: string }) {
  const queryClient = useQueryClient();

  // Every transition on this page — submit, cancel, complete — is the same
  // `PATCH /purchase-requests/{id}/status/{status}` endpoint behind one grant.
  const canChangeStatus = useCan(PERMISSIONS.purchaseRequest.updateStatus);
  const canEdit = useCan(PERMISSIONS.purchaseRequest.update);
  const canCreate = useCan(PERMISSIONS.purchaseRequest.store);
  const canViewQuotes = useCan(PERMISSIONS.canvassing.quotations);

  usePurchaseRequestUpdates();

  const {
    data: request,
    isPending,
    isError,
    error,
  } = useQuery(purchaseRequestDetailQuery(id));

  /**
   * Submitting fails two ways: the request can be incomplete, which is caught
   * here before anything is sent, or the transition itself can fail. The banner
   * shows whichever happened, so the local check is kept alongside the
   * mutation's own error.
   */
  const [validationError, setValidationError] = React.useState<string | null>(
    null,
  );

  const [highlightedItemId, setHighlightedItemId] = React.useState<
    string | null
  >(null);

  const {
    mutate: submit,
    isPending: submitting,
    error: submitFailure,
    reset: resetSubmit,
  } = useMutation({
    mutationFn: () => setPurchaseRequestStatus(id, "pending"),
    onSuccess: () => {
      // The transition returns nothing, so the new status comes from a refetch.
      // The list picks it up too.
      queryClient.invalidateQueries({
        queryKey: purchaseRequestKeys.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.lists() });
    },
  });

  const submitError =
    validationError ??
    (submitFailure
      ? submitFailure instanceof Error
        ? submitFailure.message
        : "Something went wrong."
      : null);

  if (isError) {
    return (
      <>
        <PageHeader
          title="Purchase Request"
          actions={
            <Button
              variant="outline"
              render={<Link href="/purchase-requests" />}
              nativeButton={false}
            >
              Back to Purchase Requests
            </Button>
          }
        />
        <ErrorAlert title="Couldn't load this purchase request" error={error} />
      </>
    );
  }

  if (isPending) return <DetailSkeleton />;

  const isDraft = request.status === "draft";
  const isRejected = request.status === "rejected";
  const isCanceled = request.status === "canceled";
  // Cancelling is only meaningful while there is still work to stop.
  const isClosed = isRejected || isCanceled || request.status === "completed";
  const canvassingItem = request.items.find(
    (item) => item.status === "canvassing",
  );
  /**
   * Every item delivered, but the request still says otherwise — the delivery
   * endpoints never move the parent status, so this is the only thing that
   * closes a request out. Offered only while the request is still open: a
   * canceled or rejected one keeps its outcome even if its items read
   * completed.
   */
  const canComplete =
    !isClosed &&
    request.items.length > 0 &&
    request.items.every((item) => item.status === "completed");

  function submitForApproval() {
    if (!request) return;

    setValidationError(null);
    resetSubmit();

    if (request.items.length === 0) {
      setValidationError(
        "Add at least one item before submitting — use Continue Editing.",
      );
      return;
    }

    // Nothing is edited here, so this is the transition alone — the request is
    // submitted exactly as stored.
    submit();
  }

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base">{request.no}</span>
            <StatusBadge tone={purchaseRequestTone[request.status]}>
              {purchaseRequestStatusLabels[request.status]}
            </StatusBadge>
            <PriorityBadge priority={request.priority} />
          </span>
        }
        description={
          <>
            <span className="block text-sm text-foreground">
              {request.title || (
                <span className="italic text-muted-foreground">Untitled</span>
              )}
            </span>
            <span className="block">{metaLine(request)}</span>
          </>
        }
        actions={
          isDraft ? (
            <>
              {canChangeStatus ? (
                <CancelPurchaseRequestDialog id={request._id} no={request.no} />
              ) : null}
              {canEdit ? (
                <Button
                  variant="outline"
                  render={
                    <Link href={`/purchase-requests/${request._id}/edit`} />
                  }
                  nativeButton={false}
                >
                  Continue Editing
                </Button>
              ) : null}
              {canChangeStatus ? (
                <Button onClick={submitForApproval} disabled={submitting}>
                  {submitting ? <Spinner data-icon="inline-start" /> : null}
                  Submit for Approval
                </Button>
              ) : null}
            </>
          ) : isRejected ? (
            // Revising means raising a fresh request, so this is the create
            // grant rather than a transition on the rejected one.
            canCreate ? (
              <Button
                render={<Link href="/purchase-requests/new" />}
                nativeButton={false}
              >
                Revise &amp; Resubmit
              </Button>
            ) : null
          ) : !canChangeStatus ? null : canComplete ? (
            <>
              <CompletePurchaseRequestDialog
                id={request._id}
                no={request.no}
                itemCount={request.items.length}
              />
              {request.status === "po-created" ? null : (
                <CancelPurchaseRequestDialog id={request._id} no={request.no} />
              )}
            </>
          ) : isClosed || request.status === "po-created" ? null : (
            <CancelPurchaseRequestDialog id={request._id} no={request.no} />
          )
        }
      />

      {submitError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t submit this request</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      {isDraft ? (
        <Card>
          <CardContent className="text-xs text-muted-foreground">
            No approval workflow has started — nothing to show here until you
            submit.
          </CardContent>
        </Card>
      ) : isCanceled ? (
        // The stepper has no rung for a request that stopped, so it would read
        // as still sitting at "Submitted".
        <Card>
          <CardContent className="text-xs text-muted-foreground">
            This request was canceled and is no longer being processed.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <PurchaseRequestStepper status={request.status} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
          <PurchaseRequestItemsSection
            request={request}
            onHighlightProofs={(itemId) =>
              setHighlightedItemId((current) =>
                current === itemId ? null : itemId,
              )
            }
          />

          <PurchaseRequestProofsSection
            request={request}
            highlightedItemId={highlightedItemId}
          />

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Justification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {request.justification || "No justification provided."}
              </p>
            </CardContent>
          </Card>

          {/* Comments card hidden until the backend stores comments. */}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {/* The panel's only content is a link to the canvassing screen, so
              it goes when that screen is out of reach. */}
          {canvassingItem && canViewQuotes ? (
            <PurchaseRequestActionPanel purchaseRequestId={request._id} />
          ) : null}

          <PurchaseRequestDetailsPanel request={request} />
        </div>
      </div>
    </>
  );
}
