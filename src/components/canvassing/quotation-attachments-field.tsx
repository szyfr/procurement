import { PaperclipIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";

/**
 * The backend accepts any file at any size and stores it straight to S3, so
 * the only limits that exist are the ones enforced here.
 */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_ATTACHMENTS =
  ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv";

export function QuotationAttachmentsField({
  attachments,
  error,
  onAdd,
  onRemove,
}: {
  attachments: File[];
  error?: string;
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Quotation Documents</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
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
                className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs"
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
      </CardContent>
    </Card>
  );
}
