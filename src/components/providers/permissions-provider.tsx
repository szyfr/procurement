"use client";

import * as React from "react";

import type { PermissionSlug } from "@/modules/auth/constants/permissions";
import { hasPermission } from "@/modules/auth/models/access";

/**
 * The signed-in user's grants, made available to every client component under
 * the dashboard.
 *
 * Seeded from the `(dashboard)` layout, which already has the user from
 * `getOptionalUser()`. That is deliberate: reading grants through `useSession()`
 * instead would put a fetch and a loading state in front of every gated button,
 * so a page would briefly render as though the user could do nothing and then
 * pop the actions in. Coming down as a prop, the answer is there on first paint.
 *
 * The trade is that the grants are as fresh as the last server render. A role
 * change made elsewhere shows up on the next navigation or refresh, not
 * instantly — acceptable because this only decides what is *shown*: the BFF
 * gate and FastAPI both re-check on the request itself, so a stale-permissive
 * render still cannot perform the action.
 */

const PermissionsContext = React.createContext<readonly string[] | null>(null);

export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: readonly string[];
  children: React.ReactNode;
}) {
  return (
    <PermissionsContext value={permissions}>{children}</PermissionsContext>
  );
}

function usePermissionsContext() {
  const permissions = React.useContext(PermissionsContext);

  if (permissions === null) {
    // Failing loudly rather than defaulting to "no grants": a silent empty
    // list outside the provider would read as a legitimate denial and hide
    // working UI with no clue why.
    throw new Error(
      "usePermissions must be used inside <PermissionsProvider> — it is mounted by the (dashboard) layout.",
    );
  }

  return permissions;
}

/** The raw grant list. Prefer `useCan`/`useCanAny` unless you need the list itself. */
export function usePermissions() {
  return usePermissionsContext();
}

export function useCan(permission: PermissionSlug) {
  return hasPermission(usePermissionsContext(), permission);
}
