import { ApiError } from "@/lib/api/errors";

/**
 * The write payload shared by departments and payment terms. FastAPI is
 * lenient about both fields, so the required-title check happens here where a
 * failure can be reported as a proper 422.
 */
export function parseTitleDescriptionPayload(body: unknown): {
  title: string;
  description: string;
} {
  const invalid = (message: string) =>
    new ApiError(422, "validation_failed", message);

  if (!body || typeof body !== "object")
    throw invalid("Request body is missing.");

  const payload = body as Record<string, unknown>;
  const rawTitle = payload.title;
  const rawDescription = payload.description;

  if (typeof rawTitle !== "string") {
    throw invalid("Title is required.");
  }

  const title = rawTitle.trim();
  if (!title) throw invalid("Title is required.");

  if (rawDescription != null && typeof rawDescription !== "string") {
    throw invalid("Description must be a string.");
  }

  return {
    title,
    description:
      typeof rawDescription === "string" ? rawDescription.trim() : "",
  };
}
