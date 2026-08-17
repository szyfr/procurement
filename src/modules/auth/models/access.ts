import type { PermissionSlug } from "@/modules/auth/constants/permissions";
import type { AuthenticatedUser } from "@/modules/auth/models/session";

/**
 * The one place a permission decision is made. Everything above it — the
 * sidebar, the page gates, the action buttons, the BFF's route gate — is a
 * caller of these two functions rather than its own comparison.
 *
 * The grants are whatever `/auth/me` returned, held as plain strings. There is
 * no hierarchy, no wildcard and no implied grant: `department.update` does not
 * imply `department.index`, and nothing implies anything else. Upstream checks
 * exact membership too (`if permission not in permissions`), so matching that
 * exactly is what keeps the UI's answer and the API's answer the same.
 *
 * A user with no `permissions` array at all is treated as having none. That is
 * not a hypothetical: `PermissionService.get_all_permissions` returns `[]`
 * early when a user has no `user_permissions` document, *even when they hold
 * roles that grant plenty* — so a role-only user is denied everything, here and
 * upstream alike. The UI showing them an empty app matches what the API would
 * do; it is an upstream bug to fix there, not to paper over here.
 */

/** The caller's grants, or an empty list when there are none to read. */
export function grantedPermissions(
  user: AuthenticatedUser | null | undefined,
): readonly string[] {
  return user?.permissions ?? [];
}

export function hasPermission(
  granted: readonly string[],
  permission: PermissionSlug,
): boolean {
  return granted.includes(permission);
}

/** True when *any* of the slugs is held — the rule for "can you use this screen at all?". */
export function hasAnyPermission(
  granted: readonly string[],
  permissions: readonly PermissionSlug[],
): boolean {
  return permissions.some((permission) => granted.includes(permission));
}
