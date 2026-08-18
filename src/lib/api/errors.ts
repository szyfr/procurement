/**
 * One error type and one normalization path for every API layer.
 *
 * FastAPI reports failures in at least four different shapes, and several of
 * its messages carry implementation detail (Mongo errors, stack strings). This
 * module funnels all of them into `ApiError` and decides what the browser is
 * allowed to see.
 */

export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_failed"
  | "upstream_unavailable"
  | "not_implemented"
  | "internal_error";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;

  constructor(status: number, code: ApiErrorCode, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function codeForStatus(status: number): ApiErrorCode {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 422) return "validation_failed";
  if (status === 501) return "not_implemented";
  if (status >= 500) return "internal_error";
  return "bad_request";
}

/** User-facing copy per failure class. Never derived from the upstream body. */
const publicMessages: Record<ApiErrorCode, string> = {
  bad_request:
    "That request couldn't be processed. Check the details and try again.",
  unauthorized: "Your session has expired. Sign in again to continue.",
  // Two different failures share this status: a missing permission (from our
  // own `requirePermission`, or from FastAPI's `require_permission`) and a
  // failed CSRF check on sign-in. The copy leads with the common one and still
  // suggests the reload that fixes the other.
  forbidden:
    "You don't have permission to do that. If you think you should, ask an administrator — or reload the page and try again.",
  not_found: "We couldn't find what you were looking for.",
  validation_failed:
    "Some details are missing or invalid. Review the form and try again.",
  upstream_unavailable:
    "The purchasing service isn't responding right now. Try again in a moment.",
  not_implemented: "This isn't available yet.",
  internal_error: "Something went wrong on our side. Try again in a moment.",
};

export function toPublicMessage(error: unknown) {
  if (error instanceof ApiError) {
    // Validation messages are the one upstream detail worth surfacing, since
    // they describe the user's own input rather than our internals.
    if (error.code === "validation_failed") return error.message;
    return publicMessages[error.code];
  }

  return publicMessages.internal_error;
}

/**
 * Pulls a message out of whichever error shape FastAPI happened to use:
 * `{message}`, `{detail}`, `{error, details}`, or a 422 `{detail: [...]}`.
 */
export function normalizeBackendError(status: number, body: unknown): ApiError {
  const code = codeForStatus(status);
  let message = publicMessages[code];

  if (body && typeof body === "object") {
    const payload = body as Record<string, unknown>;

    if (typeof payload.message === "string") {
      message = payload.message;
    } else if (typeof payload.detail === "string") {
      message = payload.detail;
    } else if (Array.isArray(payload.detail)) {
      const issues = payload.detail
        .map((issue) => {
          if (!issue || typeof issue !== "object") return null;
          const { loc, msg } = issue as { loc?: unknown[]; msg?: unknown };
          const field = Array.isArray(loc) ? loc.at(-1) : undefined;
          if (typeof msg !== "string") return null;
          return field ? `${field}: ${msg}` : msg;
        })
        .filter((issue): issue is string => issue !== null);

      if (issues.length > 0) message = issues.join("; ");
    } else if (typeof payload.error === "string") {
      message = payload.error;
    }
  }

  return new ApiError(status, code, message);
}

/** The `{ error }` envelope every BFF route returns on failure. */
export function toErrorResponse(error: unknown) {
  const status = error instanceof ApiError ? error.status : 500;

  return Response.json(
    { error: { message: toPublicMessage(error) } },
    { status },
  );
}
