"use client";

import { useQueries } from "@tanstack/react-query";
import { ArrowRightIcon, CalendarIcon, FileTextIcon } from "lucide-react";
import * as React from "react";

import { ProofDetailDialog } from "@/components/purchase-requests/proof-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatShortDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import {
  type PurchaseRequestDetail,
  type PurchaseRequestItem,
  type PurchaseRequestProof,
  purchaseRequestProofQuery,
} from "@/modules/purchase-requests";

export function resolveProofItems(
  proof: PurchaseRequestProof,
  items: PurchaseRequestItem[],
) {
  return proof.purchase_request_item_ids
    .map((id) => items.find((item) => item._id === id))
    .filter((item): item is PurchaseRequestItem => Boolean(item?.material));
}

function documentCountLabel(count: number) {
  if (count === 0) return "No documents attached";

  return `${count} document${count === 1 ? "" : "s"}`;
}

export function PurchaseRequestProofsSection({
  request,
  highlightedItemId,
}: {
  request: PurchaseRequestDetail;
  highlightedItemId: string | null;
}) {
  const [openProofId, setOpenProofId] = React.useState<string | null>(null);
  const sectionRef = React.useRef<HTMLDivElement>(null);

  const cachedDetails = useQueries({
    queries: request.proofs.map((proof) => ({
      ...purchaseRequestProofQuery(proof._id),
      enabled: false,
    })),
  });

  React.useEffect(() => {
    if (!highlightedItemId) return;

    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedItemId]);

  const openProof =
    request.proofs.find((proof) => proof._id === openProofId) ?? null;

  return (
    <Card ref={sectionRef}>
      <CardHeader className="flex flex-row items-baseline gap-2.5 border-b">
        <CardTitle>Proofs of Order</CardTitle>
        <span className="text-xs text-muted-foreground">
          {request.proofs.length}{" "}
          {request.proofs.length === 1 ? "proof" : "proofs"}
        </span>
      </CardHeader>
      <CardContent className="p-3">
        {request.proofs.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-6 py-8 text-center">
            <span className="text-[13px] font-medium">
              No proofs of order yet
            </span>
            <span className="text-xs text-muted-foreground">
              Select items in the table above to record one.
            </span>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {request.proofs.map((proof, index) => {
              const coveredItems = resolveProofItems(proof, request.items);
              const documents = cachedDetails[index]?.data?.documents;
              const highlighted =
                highlightedItemId !== null &&
                proof.purchase_request_item_ids.includes(highlightedItemId);

              return (
                <li key={proof._id}>
                  <button
                    type="button"
                    onClick={() => setOpenProofId(proof._id)}
                    className={cn(
                      "group flex w-full flex-col gap-3 rounded-lg border px-4 py-3.5 text-left hover:bg-accent",
                      highlighted && "ring-2 ring-foreground",
                    )}
                  >
                    <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                      <div className="flex min-w-[180px] flex-1 flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          Ref. {proof.vendor_reference_no || "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Created {formatShortDate(proof.created_at) ?? "—"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="gap-1.5">
                          <CalendarIcon aria-hidden className="size-3" />
                          Delivery {formatShortDate(proof.delivery_date) ?? "—"}
                        </Badge>
                        <Badge variant="outline" className="gap-1.5">
                          <FileTextIcon aria-hidden className="size-3" />
                          {documents
                            ? documentCountLabel(documents.length)
                            : "Documents"}
                        </Badge>
                      </div>
                    </div>

                    {coveredItems.length > 0 ? (
                      <div className="flex flex-col gap-1.5 border-l-2 pl-3">
                        {coveredItems.map((item) => (
                          <div
                            key={item._id}
                            className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
                          >
                            <span className="text-[13px]">
                              {item.material?.description}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.quantity} {item.material?.uom}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <span className="flex items-center justify-end gap-1.5 text-[13px] font-medium group-hover:underline">
                      View proof
                      <ArrowRightIcon aria-hidden className="size-3.5" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <ProofDetailDialog
        proof={openProof}
        coveredItems={
          openProof ? resolveProofItems(openProof, request.items) : []
        }
        open={openProof !== null}
        onOpenChange={(next) => {
          if (!next) setOpenProofId(null);
        }}
      />
    </Card>
  );
}
