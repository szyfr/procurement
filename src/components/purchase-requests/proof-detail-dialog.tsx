"use client";

import { useQuery } from "@tanstack/react-query";
import { FileTextIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/date";
import {
  type PurchaseRequestItem,
  type PurchaseRequestProof,
  purchaseRequestProofQuery,
} from "@/modules/purchase-requests";

const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|avif)$/i;

function isImage(filename: string) {
  return IMAGE_EXTENSIONS.test(filename);
}

function documentKind(filename: string) {
  const extension = filename.split(".").pop();

  if (!extension || extension === filename) return "Document";
  if (isImage(filename)) return `${extension.toUpperCase()} image`;

  return `${extension.toUpperCase()} document`;
}

function DocumentSkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
      <Skeleton className="size-12 rounded-md" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-2.5 w-20" />
      </div>
      <Skeleton className="h-7 w-14 rounded-md" />
    </div>
  );
}

export function ProofDetailDialog({
  proof,
  coveredItems,
  open,
  onOpenChange,
}: {
  proof: PurchaseRequestProof | null;
  coveredItems: PurchaseRequestItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    ...purchaseRequestProofQuery(proof?._id ?? ""),
    enabled: open && Boolean(proof),
  });

  const documents = data?.documents ?? [];
  const documentsLabel = isPending
    ? "Loading…"
    : documents.length === 0
      ? "No documents attached"
      : `${documents.length} document${documents.length === 1 ? "" : "s"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Proof of Order</DialogTitle>
          <DialogDescription>
            Ref. {proof?.vendor_reference_no || "—"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <dl className="flex flex-wrap gap-x-8 gap-y-3">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">
                Vendor reference
              </dt>
              <dd className="text-sm font-medium">
                {proof?.vendor_reference_no || "—"}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Delivery date</dt>
              <dd className="text-sm font-medium">
                {formatDate(proof?.delivery_date) ?? "—"}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Created</dt>
              <dd className="text-sm font-medium">
                {formatDate(proof?.created_at) ?? "—"}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium">Items covered</span>
            {coveredItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No items on this request are covered by this proof.
              </p>
            ) : (
              <ul className="divide-y overflow-hidden rounded-lg border">
                {coveredItems.map((item) => (
                  <li
                    key={item._id}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-3.5 py-2.5"
                  >
                    <span className="min-w-[200px] flex-1 text-[13px]">
                      {item.material?.description}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.quantity} {item.material?.uom}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] font-medium">Documents</span>
              {isError ? null : (
                <span className="text-xs text-muted-foreground">
                  {documentsLabel}
                </span>
              )}
            </div>

            {isError ? (
              <Alert variant="destructive">
                <AlertTitle>Couldn&apos;t load this proof</AlertTitle>
                <AlertDescription className="flex flex-col items-start gap-2">
                  <span>
                    {error instanceof Error
                      ? error.message
                      : "Something went wrong."}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isFetching}
                    onClick={() => refetch()}
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : isPending ? (
              <div className="flex flex-col gap-2">
                <DocumentSkeletonRow />
                <DocumentSkeletonRow />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col gap-1 rounded-lg border border-dashed px-6 py-6 text-center">
                <span className="text-[13px] font-medium">
                  No documents attached
                </span>
                <span className="text-xs text-muted-foreground">
                  This proof was recorded without a file.
                </span>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {documents.map((document) => (
                  <li
                    key={document._id}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                      {isImage(document.filename) ? (
                        // biome-ignore lint/performance/noImgElement: presigned S3 urls aren't a configured next/image host.
                        <img
                          src={document.url}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <FileTextIcon
                          aria-hidden
                          className="size-[18px] text-muted-foreground"
                        />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[13px] font-medium">
                        {document.filename}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {documentKind(document.filename)}
                      </span>
                    </span>
                    {}
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${document.filename}`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      Open
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
