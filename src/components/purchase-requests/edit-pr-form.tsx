"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { PurchaseRequestFormLayout } from "@/components/purchase-requests/pr-form-layout";
import { usePurchaseRequestForm } from "@/components/purchase-requests/use-pr-form";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorAlert } from "@/components/shared/query-states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  purchaseRequestDetailQuery,
  purchaseRequestKeys,
  setPurchaseRequestStatus,
  type UpdatePurchaseRequestDto,
  updatePurchaseRequest,
} from "@/modules/purchase-requests";

/**
 * Edit form for an existing request. Fetches the request once on mount, then
 * behaves like the create form — same fields, same line item editor — but
 * PUTs the changes back instead of POSTing a new request.
 */

const submissionChecklist = [
  "Items that need canvassing are routed there automatically; direct items let you pick a vendor now.",
  "Every item needs a quantity before submitting.",
  "Estimated costs are for approval routing only and aren't saved — the backend has no field for them yet.",
];

const routingNote =
  "Approval routing isn't modelled on the backend yet. Requests move on once their items are processed.";

/** `submit` distinguishes "Save Changes" from "Submit for Approval". */
interface SaveInput {
  payload: UpdatePurchaseRequestDto;
  submit: boolean;
}

function EditFormSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-96 w-full lg:col-span-2" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export function EditPurchaseRequestForm({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = usePurchaseRequestForm();

  const {
    data: request,
    isPending: loading,
    isError,
    error: loadError,
  } = useQuery(purchaseRequestDetailQuery(id));

  const {
    mutate: save,
    isPending: saving,
    error,
    variables,
  } = useMutation({
    /**
     * Submitting is always save-then-transition: the PUT carries the edits the
     * user just made, and the status endpoint moves the request — and its items
     * — to `pending`. A draft with unsaved edits would otherwise be submitted
     * as whatever was last stored.
     */
    mutationFn: async ({ payload, submit }: SaveInput) => {
      const updated = await updatePurchaseRequest(id, payload);
      if (submit) await setPurchaseRequestStatus(id, "pending");

      return updated;
    },
    onSuccess: (updated) => {
      // Never seeded from the response: a write returns the stored request
      // without the detail pipeline's joins — no `proofs`, no `department`, no
      // per-item `material` — and the detail page reads all of them. It also
      // predates the transition a submit performs. Refetching is the only way
      // to get the shape that page renders.
      queryClient.invalidateQueries({
        queryKey: purchaseRequestKeys.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.lists() });
      router.push(`/purchase-requests/${updated._id}`);
    },
  });

  // One mutation drives both buttons; which is busy comes from the payload it
  // was called with, keeping the two spinners independent.
  const savingChanges = saving && variables?.submit === false;
  const submittingForApproval = saving && variables?.submit === true;

  /**
   * Seeds the form from the fetched request, once per request. The ref matters:
   * these fields are editable from here on, so a later background refetch
   * handing back a new object must not overwrite what the user has typed.
   */
  const seededRef = React.useRef<string | null>(null);
  const { seedFrom } = form;

  React.useEffect(() => {
    if (!request || seededRef.current === request._id) return;
    seededRef.current = request._id;

    seedFrom(request);
  }, [request, seedFrom]);

  function submitForm(submit: boolean) {
    const payload = form.validate();
    if (!payload) return;

    save({ payload, submit });
  }

  if (isError) {
    return (
      <>
        <PageHeader
          title="Edit Purchase Request"
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
        <ErrorAlert
          title="Couldn't load this purchase request"
          error={loadError}
        />
      </>
    );
  }

  if (loading) return <EditFormSkeleton />;

  return (
    <>
      <PageHeader
        title="Edit Purchase Request"
        actions={
          <>
            <Button
              variant="outline"
              render={<Link href={`/purchase-requests/${id}`} />}
              nativeButton={false}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => submitForm(false)}
              disabled={savingChanges || submittingForApproval}
            >
              {savingChanges ? <Spinner data-icon="inline-start" /> : null}
              Save Changes
            </Button>
            <Button
              onClick={() => submitForm(true)}
              disabled={savingChanges || submittingForApproval}
            >
              {submittingForApproval ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              Submit for Approval
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorAlert title="Couldn't save this request" error={error} />
      ) : null}

      <PurchaseRequestFormLayout
        form={form}
        checklist={submissionChecklist}
        routingNote={routingNote}
      />
    </>
  );
}
