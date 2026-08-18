import {
  PERMISSION_MODULES,
  UNGROUPED_MODULE_KEY,
  UNGROUPED_MODULE_LABEL,
} from "@/modules/permissions/constants";
import type { Permission } from "@/modules/permissions/models/permission";

/**
 * Splitting the flat `/permissions` catalogue into the modules the UI groups by.
 *
 * `title` is a `module.action` key (`purchase_request.store`) and the backend
 * sends nothing else — no module field, no ordering, no grouping. Everything
 * here is derived from the part before the first dot, which is why a permission
 * the backend adds tomorrow lands in the right group without a change here.
 */

export interface PermissionModuleGroup {
  /** The slug prefix — stable id for React keys and expand/collapse state. */
  key: string;
  label: string;
  permissions: Permission[];
}

/** The prefix a permission belongs to, or the catch-all when it has no dot. */
export function permissionModuleKey(permission: Permission): string {
  const separator = permission.title.indexOf(".");

  return separator > 0
    ? permission.title.slice(0, separator)
    : UNGROUPED_MODULE_KEY;
}

/** "payment_term" → "Payment Term". Only reached for a prefix we don't list. */
function titleCase(prefix: string) {
  return prefix
    .split(/[_-]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function moduleLabel(key: string) {
  if (key === UNGROUPED_MODULE_KEY) return UNGROUPED_MODULE_LABEL;

  return (
    PERMISSION_MODULES.find((module) => module.prefix === key)?.label ??
    titleCase(key)
  );
}

/**
 * Groups a permission list by module, in the curated order — unknown prefixes
 * sort alphabetically after the known ones, and the ungrouped bucket sits last.
 *
 * Empty groups are never produced: a module appears only if the list actually
 * contains a permission for it, so this is safe to call on a whole catalogue or
 * on the handful of grants one role holds.
 */
export function groupPermissionsByModule(
  permissions: readonly Permission[],
): PermissionModuleGroup[] {
  const byKey = new Map<string, Permission[]>();

  for (const permission of permissions) {
    const key = permissionModuleKey(permission);
    const group = byKey.get(key);

    if (group) group.push(permission);
    else byKey.set(key, [permission]);
  }

  const order = new Map(
    PERMISSION_MODULES.map((module, index) => [module.prefix, index]),
  );
  // Unknown prefixes and the catch-all both sort after the curated list; the
  // catch-all after those again, so "Other" is always the final group.
  const rank = (key: string) => {
    if (key === UNGROUPED_MODULE_KEY) return Number.MAX_SAFE_INTEGER;
    return order.get(key) ?? PERMISSION_MODULES.length;
  };

  return [...byKey.entries()]
    .map(([key, groupPermissions]) => ({
      key,
      label: moduleLabel(key),
      permissions: groupPermissions,
    }))
    .sort(
      (a, b) => rank(a.key) - rank(b.key) || a.label.localeCompare(b.label),
    );
}
