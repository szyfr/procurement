import { ApiError } from "@/lib/api/errors";

/**
 * Attachment limits for the two multipart endpoints (vendor quotations and
 * delivery proofs).
 *
 * FastAPI accepts any file at any size and streams it to S3, so these are the
 * only limits that exist. They were previously enforced in the file picker
 * alone, which is a hint to the user rather than a control — a direct `POST`
 * skips it entirely, and `request.formData()` buffers the whole body in the
 * Node process before any of our code runs.
 *
 * Extension rather than `Content-Type`: both are attacker-supplied on a
 * hand-built request, but the extension is what determines how the file is
 * treated when it is later downloaded from S3.
 */

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENT_COUNT = 10;
export const MAX_TOTAL_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export const ACCEPTED_ATTACHMENT_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
] as const;

/** The `accept` attribute for a file input, derived so the two cannot drift. */
export const ACCEPTED_ATTACHMENTS = ACCEPTED_ATTACHMENT_EXTENSIONS.join(",");

function megabytes(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

function invalid(message: string) {
  return new ApiError(422, "validation_failed", message);
}

/**
 * The `attachments` parts of a multipart form, validated.
 *
 * Empty parts are what a file input contributes when nothing was picked, so
 * they are dropped rather than rejected.
 */
export function readAttachments(form: FormData, field = "attachments"): File[] {
  const attachments = form
    .getAll(field)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (attachments.length > MAX_ATTACHMENT_COUNT) {
    throw invalid(`Attach at most ${MAX_ATTACHMENT_COUNT} files.`);
  }

  let total = 0;

  for (const file of attachments) {
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (
      !file.name.includes(".") ||
      !(ACCEPTED_ATTACHMENT_EXTENSIONS as readonly string[]).includes(extension)
    ) {
      throw invalid(
        `"${file.name}" is not an accepted file type. Allowed: ${ACCEPTED_ATTACHMENT_EXTENSIONS.join(", ")}.`,
      );
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw invalid(
        `"${file.name}" is larger than ${megabytes(MAX_ATTACHMENT_BYTES)}.`,
      );
    }

    total += file.size;
  }

  if (total > MAX_TOTAL_ATTACHMENT_BYTES) {
    throw invalid(
      `Attachments come to more than ${megabytes(MAX_TOTAL_ATTACHMENT_BYTES)} in total.`,
    );
  }

  return attachments;
}
