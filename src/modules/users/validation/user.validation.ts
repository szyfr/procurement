import { ApiError } from "@/lib/api/errors";
import { MIN_PASSWORD_LENGTH } from "@/modules/users/constants";
import type { CreateUserDto } from "@/modules/users/dto/create-user.dto";
import type { UpdateUserDto } from "@/modules/users/dto/update-user.dto";
import type { UpdateUserRolesDto } from "@/modules/users/dto/update-user-roles.dto";

/**
 * Request-body validation for the user BFF routes, so a bad payload can be
 * reported as a proper 422 instead of round-tripping to FastAPI first.
 */

const invalid = (message: string) =>
  new ApiError(422, "validation_failed", message);

function readObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object")
    throw invalid("Request body is missing.");

  return body as Record<string, unknown>;
}

function requiredText(value: unknown, label: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw invalid(`${label} is required.`);
  return text;
}

/**
 * `POST /api/users`.
 *
 * Email format is left to FastAPI, whose 422 already names the offending
 * field. The password length check is ours: it enforces the *login* floor,
 * which register does not — see `MIN_PASSWORD_LENGTH`.
 */
export function parseCreateUserPayload(body: unknown): CreateUserDto {
  const payload = readObject(body);

  const firstname = requiredText(payload.firstname, "First name");
  const lastname = requiredText(payload.lastname, "Last name");
  const email = requiredText(payload.email, "Email");

  // Not trimmed: leading and trailing spaces are part of a password.
  const password = payload.password;
  if (typeof password !== "string" || !password)
    throw invalid("Password is required.");

  if (password.length < MIN_PASSWORD_LENGTH)
    throw invalid(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );

  if (payload.confirm_password !== password)
    throw invalid("Passwords do not match.");

  return { firstname, lastname, email, password, confirm_password: password };
}

/** `PUT /api/users/{id}`. The endpoint takes no password — see `UpdateUserDto`. */
export function parseUpdateUserPayload(body: unknown): UpdateUserDto {
  const payload = readObject(body);

  return {
    firstname: requiredText(payload.firstname, "First name"),
    lastname: requiredText(payload.lastname, "Last name"),
    email: requiredText(payload.email, "Email"),
  };
}

/** `PATCH /api/users/{id}/roles`. */
export function parseUpdateUserRolesPayload(body: unknown): UpdateUserRolesDto {
  const payload = readObject(body);

  const roleIds = payload.role_ids;
  if (
    !Array.isArray(roleIds) ||
    !roleIds.every((id) => typeof id === "string")
  ) {
    throw invalid("Role ids are required.");
  }

  return { role_ids: roleIds };
}
