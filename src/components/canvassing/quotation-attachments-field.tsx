import { FileTextIcon, PaperclipIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuotationDocument } from "@/modules/canvassing";

/**
 * The backend accepts any file at any size and stores it straight to S3, so
 * the only limits that exist are the ones enforced here.
 */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_ATTACHMENTS =
  ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv";

/** Shared so a new quote and an edited one enforce the ceiling above identically. */
export function acceptAttachments(files: FileList | null): {
  accepted: File[];
  error?: string;
} {
  if (!files || files.length === 0) return { accepted: [] };

  const picked = Array.from(files);
  const oversized = picked.filter((file) => file.size > MAX_ATTACHMENT_BYTES);

  return {
    accepted: picked.filter((file) => file.size <= MAX_ATTACHMENT_BYTES),
    error:
      oversized.length > 0
        ? `${oversized.map((file) => file.name).join(", ")} — each file must be under 10 MB.`
        : undefined,
  };
}

const fileRowClass =
  "flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs";

export function QuotationAttachmentsField({
  attachments,
  error,
  onAdd,
  onRemove,
  documents,
  loadingDocuments,
}: {
  attachments: File[];
  error?: string;
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  /** What the quote already carries. Absent when the quote is a new one. */
  documents?: QuotationDocument[];
  loadingDocuments?: boolean;
}) {
  const editing = documents !== undefined || loadingDocuments === true;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Quotation Documents</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {editing ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">
              Already attached
            </span>
            {loadingDocuments ? (
              <Skeleton className="h-7 w-full" />
            ) : documents && documents.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {documents.map((document) => (
                  <li key={document._id} className={fileRowClass}>
                    <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 truncate text-primary hover:underline"
                    >
                      {document.filename}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                No files were attached to this quote.
              </p>
            )}
          </div>
        ) : null}

        <label
          htmlFor="attachments"
          className="flex cursor-pointer items-center justify-center rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground hover:bg-accent"
        >
          Upload the vendor&apos;s quotation (PDF, image, or spreadsheet)
          <input
            id="attachments"
            name="attachments"
            type="file"
            multiple
            accept={ACCEPTED_ATTACHMENTS}
            className="sr-only"
            onChange={(event) => {
              onAdd(event.target.files);
              // Lets the same file be re-picked after it's removed.
              event.target.value = "";
            }}
          />
        </label>

        {error ? <FieldError>{error}</FieldError> : null}

        {attachments.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {attachments.map((file, index) => (
              <li
                key={`${file.name}-${file.lastModified}`}
                className={fileRowClass}
              >
                <PaperclipIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {Math.max(1, Math.round(file.size / 1024))} KB
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onRemove(index)}
                >
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        {/* The upstream only honours its delete list when a new file is
            uploaded alongside it, so a Remove on an attached file would
            silently do nothing. */}
        {editing ? (
          <p className="text-xs text-muted-foreground">
            Files can be added but not removed yet.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
