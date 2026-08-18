import { ApiError } from "@/lib/api/errors";
import { MIN_PASSWORD_LENGTH } from "@/modules/auth/constants";
import type { ChangePasswordDto } from "@/modules/auth/dto";

/**
 * Request-body validation for `PATCH /api/auth/change-password`.
 *
 * Unlike login, the rules are duplicated rather than left to FastAPI: a failed
 * change-password reaches the user mid-form, and upstream's answer is either a
 * raw pydantic 422 (`password: String should have at least 6 characters`) or,
 * for the mismatch, a `ValueError` that surfaces as an unlabelled 422. Catching
 * both here keeps the round trip for the one check only the backend can make —
 * whether the old password is right.
 */
export function parseChangePasswordPayload(body: unknown): ChangePasswordDto {
  const invalid = (message: string) =>
    new ApiError(422, "validation_failed", message);

  if (!body || typeof body !== "object")
    throw invalid("Request body is missing.");

  const payload = body as Record<string, unknown>;

  // Not trimmed anywhere below: leading and trailing spaces are part of a
  // password.
  const oldPassword = payload.old_password;
  if (typeof oldPassword !== "string" || !oldPassword)
    throw invalid("Your current password is required.");

  const password = payload.password;
  if (typeof password !== "string" || !password)
    throw invalid("A new password is required.");

  if (password.length < MIN_PASSWORD_LENGTH)
    throw invalid(
      `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );

  if (payload.confirm_password !== password)
    throw invalid("Passwords do not match.");

  return {
    old_password: oldPassword,
    password,
    confirm_password: password,
  };
}
