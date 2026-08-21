"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PurchaseRequestFormLayout } from "@/components/purchase-requests/pr-form-layout";
import { usePurchaseRequestForm } from "@/components/purchase-requests/use-pr-form";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorAlert } from "@/components/shared/query-states";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createPurchaseRequest } from "@/modules/purchase-requests";

/**
 * Create form. Owns all state for the request and its line items, then posts
 * once through the BFF.
 *
 * The requester is not collected here: the BFF fills `requester_id` in
 * server-side from the signed-in user's session cookie.
 */

const submissionChecklist = [
  "Items that need canvassing are routed there automatically.",
  "Every item needs a quantity before submitting.",
  "Save as Draft leaves the request in draft; Submit for Approval sends it in as pending straight away.",
];

const routingNote =
  "Approval routing itself isn't modelled on the backend yet — submitting only sets the request's status to pending.";

export function NewPurchaseRequestForm() {
  const router = useRouter();
  const form = usePurchaseRequestForm();

  const {
    mutate: create,
    isPending: submitting,
    error,
  } = useMutation({
    mutationFn: createPurchaseRequest,
    onSuccess: (created) => router.push(`/purchase-requests/${created._id}`),
  });

  function submit(status: "draft" | "pending") {
    const payload = form.validate();
    if (payload) {
      // A submitted request's items go in as `pending-assessment`, the state
      // the backend's assessment pass has yet to look at. The request itself
      // stays `pending` — its own enum has no such member.
      const itemStatus = status === "pending" ? "pending-assessment" : status;

      create({
        ...payload,
        status,
        items: payload.items.map((item) => ({ ...item, status: itemStatus })),
      });
    }
  }

  return (
    <>
      <PageHeader
        title="New Purchase Request"
        actions={
          <>
            <Button
              variant="outline"
              render={<Link href="/purchase-requests" />}
              nativeButton={false}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => submit("draft")}
              disabled={submitting}
            >
              Save as Draft
            </Button>
            <Button onClick={() => submit("pending")} disabled={submitting}>
              {submitting ? <Spinner data-icon="inline-start" /> : null}
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
