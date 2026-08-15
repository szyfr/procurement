import { PaperclipIcon, XIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { ACCEPTED_ATTACHMENTS, MAX_ATTACHMENT_BYTES } from "@/lib/api/uploads";

/**
 * Re-exported so the picker and the Route Handler that receives its files
 * cannot drift apart. The limits themselves are enforced server-side in
 * `lib/api/uploads`; what happens here is only the early warning.
 */
export { ACCEPTED_ATTACHMENTS, MAX_ATTACHMENT_BYTES };

/**
 * The picker and its running file list, with no chrome around it. The create
 * page wraps this in a Card; the edit dialog puts it in a plain section.
 */
export function QuotationAttachmentsControl({
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
  // Generated rather than fixed, so a second instance on the same screen can't
  // steal this one's label.
  const inputId = React.useId();

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-center justify-center rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground hover:bg-accent"
      >
        Upload the vendor&apos;s quotation (PDF, image, or spreadsheet)
        <input
          id={inputId}
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
    </div>
  );
}

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
      <CardContent>
        <QuotationAttachmentsControl
          attachments={attachments}
          error={error}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      </CardContent>
    </Card>
  );
}
