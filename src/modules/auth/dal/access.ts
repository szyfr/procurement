import { ApiError } from "@/lib/api/errors";
import type { PermissionSlug } from "@/modules/auth/constants/permissions";
import { getCurrentUser, getOptionalUser } from "@/modules/auth/dal/auth.dal";
import {
  grantedPermissions,
  hasAnyPermission,
} from "@/modules/auth/models/access";
import type { AuthenticatedUser } from "@/modules/auth/models/session";

/**
 * The server-side half of access control: page shells ask `canAccess`, Route
 * Handlers call `requirePermission`.
 *
 * It lives beside the DAL rather than in the module barrel for the same reason
 * the DAL and the cookie writer do — it calls `/auth/me` and must never be
 * reachable from a client bundle.
 *
 * Both read the session through `getCurrentUser`, which is memoized per request
 * with React `cache`, so gating a Route Handler costs no extra upstream call
 * beyond the `requireUser()` it replaces.
 */

/** For page shells: `false` renders the no-access state instead of the page. */
export async function canAccess(
  ...permissions: readonly PermissionSlug[]
): Promise<boolean> {
  // Not signed in is the layout's problem, not this one — it redirects before
  // a page body renders, so `null` here just means "no grants".
  const user = await getOptionalUser();

  return hasAnyPermission(grantedPermissions(user), permissions);
}

/**
 * The gate a Route Handler runs instead of `requireUser()`: 401 when there is
 * no valid session, 403 when the session holds no matching grant.
 *
 * FastAPI enforces the same slug on the same endpoint, so this does not create
 * access the backend would refuse — it refuses first, at our own boundary, and
 * without a round trip. Where several slugs are passed, any one of them opens
 * the route; that is only for routes fanning out to endpoints with different
 * upstream requirements.
 */
export async function requirePermission(
  ...permissions: readonly PermissionSlug[]
): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!hasAnyPermission(grantedPermissions(user), permissions)) {
    throw new ApiError(
      403,
      "forbidden",
      // Never surfaced to the browser — `toPublicMessage` replaces it with the
      // fixed copy for `forbidden`. It is here for the server log.
      `Missing permission: ${permissions.join(" or ")}`,
    );
  }

  return user;
}
