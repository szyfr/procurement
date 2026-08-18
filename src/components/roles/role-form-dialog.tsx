"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import * as React from "react";

import { PermissionModuleList } from "@/components/roles/permission-module-list";
import { SectionLabel } from "@/components/roles/role-primitives";
import { ErrorAlert } from "@/components/shared/query-states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { MAX_PAGE_SIZE } from "@/lib/api/pagination";
import {
  groupPermissionsByModule,
  type PermissionModuleGroup,
  permissionListQuery,
} from "@/modules/permissions";
import {
  createRole,
  type Role,
  roleKeys,
  type UpdateRoleResult,
  updateRole,
} from "@/modules/roles";

/**
 * Create and edit share one dialog: the only differences are the copy and
 * whether the fields start populated. Create persists through `POST /roles`,
 * edit through `PUT /roles/{id}` — the update endpoint answers with a
 * confirmation message rather than the saved role, so the edited fields
 * (not the response) drive the toast and cache invalidation.
 *
 * The permission catalogue comes from `GET /permissions`, fetched at the
 * backend's page-size cap, and is grouped into collapsible module cards. There
 * is no module field upstream — the grouping is derived from the `module.action`
 * shape of `title`, see `groupPermissionsByModule`.
 */

interface DraftRole {
  name: string;
  description: string;
  permissions: Set<string>;
}

function draftFrom(role: Role | null): DraftRole {
  return {
    name: role?.title ?? "",
    description: role?.description ?? "",
    permissions: new Set(role?.permission_ids ?? []),
  };
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The role being edited; null when creating from scratch. */
  role: Role | null;
  mode: "create" | "edit";
}) {
  const [draft, setDraft] = React.useState<DraftRole>(() => draftFrom(role));
  const [search, setSearch] = React.useState("");
  /** Module keys the user has opened. Everything starts collapsed. */
  const [expandedKeys, setExpandedKeys] = React.useState<Set<string>>(
    () => new Set(),
  );
  const queryClient = useQueryClient();

  const isEdit = mode === "edit";

  const { mutate: submitRole, isPending: submitting } = useMutation({
    mutationFn: (values: DraftRole): Promise<Role | UpdateRoleResult> =>
      isEdit && role
        ? updateRole(role._id, {
            title: values.name,
            description: values.description,
            permission_ids: Array.from(values.permissions),
          })
        : createRole({
            title: values.name,
            description: values.description,
            permission_ids: Array.from(values.permissions),
          }),
    onSuccess: (_result, values) => {
      toast.add({
        title: `${values.name} ${isEdit ? "updated" : "created"}`,
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      onOpenChange(false);
    },
    onError: (mutationError) => {
      toast.add({
        title: isEdit ? "Couldn't update role" : "Couldn't create role",
        description:
          mutationError instanceof Error
            ? mutationError.message
            : "Something went wrong.",
        type: "error",
      });
    },
  });

  // Reopening for a different role has to reset the whole form, including the
  // toolbar state — otherwise a stale search would hide most of the catalogue.
  const [lastOpenedFor, setLastOpenedFor] = React.useState<string | null>(null);
  const openedFor = open ? `${mode}:${role?._id ?? "new"}` : null;
  if (openedFor !== lastOpenedFor) {
    setLastOpenedFor(openedFor);
    setDraft(draftFrom(role));
    setSearch("");
    setExpandedKeys(new Set());
  }

  const {
    data: permissionsPage,
    isPending,
    isError,
    error,
  } = useQuery({ ...permissionListQuery(1, MAX_PAGE_SIZE), enabled: open });

  const permissions = permissionsPage?.data ?? [];
  const totalPermissions = permissionsPage?.pagination.total_items ?? 0;

  const query = search.trim().toLowerCase();

  const allGroups = React.useMemo(
    () => groupPermissionsByModule(permissions),
    [permissions],
  );

  /**
   * Searching narrows to matching permissions, except when the module's own
   * name is what matched — then the whole module stays, since "payment terms"
   * is a search for the group rather than for one action in it.
   */
  const visibleGroups = React.useMemo(() => {
    if (!query) return allGroups;

    return allGroups
      .map((group) => {
        if (group.label.toLowerCase().includes(query)) return group;

        const matches = group.permissions.filter(
          (permission) =>
            permission.title.toLowerCase().includes(query) ||
            permission.description.toLowerCase().includes(query),
        );

        return matches.length > 0 ? { ...group, permissions: matches } : null;
      })
      .filter((group): group is PermissionModuleGroup => group !== null);
  }, [allGroups, query]);

  // While searching, every surviving module is open — the results are the point
  // of the search, and leaving them behind a chevron hides them twice over.
  const openKeys = query
    ? new Set(visibleGroups.map((group) => group.key))
    : expandedKeys;

  const grantedCount = draft.permissions.size;
  const grantedModuleCount = allGroups.filter((group) =>
    group.permissions.some((permission) =>
      draft.permissions.has(permission._id),
    ),
  ).length;

  function togglePermission(id: string, granted: boolean) {
    setDraft((current) => {
      const next = new Set(current.permissions);
      if (granted) next.add(id);
      else next.delete(id);
      return { ...current, permissions: next };
    });
  }

  /** Grants or clears a whole module in one action. */
  function setModuleGranted(group: PermissionModuleGroup, granted: boolean) {
    setDraft((current) => {
      const next = new Set(current.permissions);

      for (const permission of group.permissions) {
        if (granted) next.add(permission._id);
        else next.delete(permission._id);
      }

      return { ...current, permissions: next };
    });
  }

  function setExpanded(key: string, expanded: boolean) {
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (expanded) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function save() {
    submitRole(draft);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-[720px]">
        <DialogHeader className="gap-1 border-b px-5 py-4 pr-12">
          <DialogTitle>
            {mode === "edit" ? "Edit role" : "New role"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Changes apply to everyone assigned to this role the next time they sign in."
              : "Name the role, then grant the permissions it needs. You can assign users afterwards."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3.5 border-b px-5 py-4">
          <SectionLabel>Basic information</SectionLabel>
          <div className="grid gap-3.5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="role-name">Role name</Label>
              <Input
                id="role-name"
                value={draft.name}
                placeholder="e.g. Purchasing Officer"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="role-description">Description</Label>
              <Input
                id="role-description"
                value={draft.description}
                placeholder="What this role is allowed to do, in one sentence."
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* The permission list is the only scroller, so the toolbar and footer stay put. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-accent px-5 py-3">
            <InputGroup className="w-[250px] bg-background">
              <InputGroupInput
                type="search"
                value={search}
                placeholder="Search permissions…"
                aria-label="Search permissions"
                onChange={(event) => setSearch(event.target.value)}
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
            <p className="text-xs text-muted-foreground tabular-nums">
              {grantedCount} of {totalPermissions} permissions selected
            </p>
            <div className="ml-auto flex items-center gap-2">
              {/* Hidden while searching: the modules are force-opened then, so
                  the controls would contradict what's on screen. */}
              {query ? null : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={visibleGroups.length === 0}
                    onClick={() =>
                      setExpandedKeys(
                        new Set(visibleGroups.map((group) => group.key)),
                      )
                    }
                  >
                    Expand all
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={expandedKeys.size === 0}
                    onClick={() => setExpandedKeys(new Set())}
                  >
                    Collapse all
                  </Button>
                  <Separator orientation="vertical" className="h-5" />
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={permissions.length === 0}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    permissions: new Set(permissions.map((p) => p._id)),
                  }))
                }
              >
                Select all
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    permissions: new Set(),
                  }))
                }
              >
                Clear all
              </Button>
            </div>
          </div>

          <div className="px-5 py-4">
            {isError ? (
              <ErrorAlert title="Couldn't load permissions" error={error} />
            ) : isPending ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 6 }, (_, row) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder rows
                  <Skeleton key={row} className="h-11 w-full" />
                ))}
              </div>
            ) : visibleGroups.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No permissions match &ldquo;{search.trim()}&rdquo;
              </p>
            ) : (
              <PermissionModuleList
                groups={visibleGroups}
                grantedIds={draft.permissions}
                expandedKeys={openKeys}
                onExpandedChange={setExpanded}
                onTogglePermission={togglePermission}
                onSetModule={setModuleGranted}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-b-xl border-t bg-accent px-5 py-3.5">
          <div className="min-w-0">
            <p className="font-semibold tabular-nums">
              {grantedCount} / {totalPermissions}
            </p>
            <p className="text-xs text-muted-foreground">
              {grantedCount === 0
                ? "No permissions granted yet — the role will have no access."
                : `permissions granted across ${grantedModuleCount} ${
                    grantedModuleCount === 1 ? "module" : "modules"
                  }`}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={draft.name.trim().length === 0 || submitting}
              onClick={save}
            >
              {submitting
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save changes"
                  : "Create role"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
