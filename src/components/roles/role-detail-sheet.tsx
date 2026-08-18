"use client";

import { useQuery } from "@tanstack/react-query";
import { PencilIcon, Trash2Icon } from "lucide-react";

import { useCan } from "@/components/providers/permissions-provider";
import { SectionLabel } from "@/components/roles/role-primitives";
import { ErrorAlert } from "@/components/shared/query-states";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { MAX_PAGE_SIZE } from "@/lib/api/pagination";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import {
  groupPermissionsByModule,
  permissionListQuery,
} from "@/modules/permissions";
import type { Role } from "@/modules/roles";
import { roleDetailQuery } from "@/modules/roles";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

/** One of the three counters above the permission breakdown. */
function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-2.5 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-base font-bold tabular-nums">{value}</p>
    </div>
  );
}

/**
 * Read-only summary of one role, opened by clicking its row.
 *
 * The list row only carries `permission_ids`, so the sheet fetches
 * `GET /roles/{id}` itself to get the joined permission documents (title +
 * description) it needs to render the grant list.
 *
 * It also reads the whole catalogue, for the denominators: "4 of 7 purchase
 * request permissions" is the useful reading, and the role document alone can
 * only say "4". That is the same cached query the role form dialog runs, so
 * having opened either one, the other costs nothing.
 */
export function RoleDetailSheet({
  role,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}) {
  const canEdit = useCan(PERMISSIONS.role.update);
  const canDelete = useCan(PERMISSIONS.role.delete);

  const { data, isPending, isError, error } = useQuery({
    ...roleDetailQuery(role?._id ?? ""),
    enabled: open && Boolean(role),
  });

  const { data: catalogue } = useQuery({
    ...permissionListQuery(1, MAX_PAGE_SIZE),
    enabled: open,
  });

  const grantedIds = new Set(data?.permissions.map((p) => p._id) ?? []);

  /**
   * Every module in the catalogue, each carrying how much of it this role
   * holds. Built from the catalogue rather than from the role's own grants, so
   * a module the role has nothing in still shows as `0 / 5` instead of
   * vanishing — which is the difference between "not granted" and "not a thing".
   */
  const moduleGroups = groupPermissionsByModule(catalogue?.data ?? []).map(
    (group) => ({
      ...group,
      granted: group.permissions.filter((permission) =>
        grantedIds.has(permission._id),
      ).length,
    }),
  );

  if (!role) return null;

  const granted = data?.permissions.length ?? role.permission_ids.length;
  const totalPermissions = catalogue?.pagination.total_items ?? 0;
  const grantedModules = moduleGroups.filter(
    (group) => group.granted > 0,
  ).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* The side-scoped widths have to be overridden on the same selector, or
          the base `data-[side=right]:w-3/4` outranks a plain `w-` utility. */}
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-[470px] data-[side=right]:sm:max-w-[470px]">
        <SheetHeader className="gap-1 border-b p-4 pr-24">
          <SheetDescription className="font-mono text-xs">—</SheetDescription>
          <SheetTitle>{role.title}</SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
          {isError ? (
            <ErrorAlert title="Couldn't load role details" error={error} />
          ) : null}

          <section className="flex flex-col gap-3">
            <SectionLabel>Role information</SectionLabel>
            <p className="leading-relaxed text-muted-foreground">
              {role.description}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role type" value="—" />
            </div>
          </section>

          <section className="flex flex-col gap-2.5">
            <SectionLabel>Permission summary</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              <SummaryTile label="Granted" value={String(granted)} />
              <SummaryTile
                label="Of total"
                value={totalPermissions === 0 ? "—" : String(totalPermissions)}
              />
              <SummaryTile
                label="Modules"
                value={
                  moduleGroups.length === 0
                    ? "—"
                    : `${grantedModules} / ${moduleGroups.length}`
                }
              />
            </div>
            <Progress
              value={
                totalPermissions === 0 ? 0 : (granted / totalPermissions) * 100
              }
              aria-label="Share of all permissions granted to this role"
              className="gap-0 [&_[data-slot=progress-track]]:h-2"
            />
          </section>

          <section className="flex flex-col gap-2">
            <SectionLabel>Permission groups</SectionLabel>
            {isPending ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }, (_, row) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder rows
                  <Skeleton key={row} className="h-9 w-full" />
                ))}
              </div>
            ) : moduleGroups.length === 0 ? (
              <p className="text-muted-foreground">
                The permission catalogue couldn&apos;t be read, so this
                role&apos;s {granted} grants can&apos;t be broken down by
                module.
              </p>
            ) : (
              <ul>
                {moduleGroups.map((group) => {
                  const complete = group.granted === group.permissions.length;

                  return (
                    <li
                      key={group.key}
                      className="flex items-center gap-2.5 border-b py-2.5 last:border-0"
                    >
                      <span
                        className={cn(
                          "flex-1 truncate",
                          group.granted === 0 && "text-muted-foreground",
                        )}
                      >
                        {group.label}
                      </span>
                      <Progress
                        value={(group.granted / group.permissions.length) * 100}
                        aria-hidden
                        className="w-24 shrink-0 gap-0"
                      />
                      <span
                        className={cn(
                          "inline-flex h-[19px] shrink-0 items-center rounded-md border px-1.5 text-[11px] font-semibold leading-none tabular-nums",
                          // Green marks a module granted in full, not merely
                          // touched — the sheet is a summary, so "complete" is
                          // the fact worth picking out of a list of ratios.
                          complete
                            ? "border-status-success-border bg-status-success-subtle text-status-success-fg"
                            : "border-transparent bg-muted text-muted-foreground",
                        )}
                      >
                        {group.granted} / {group.permissions.length}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <SectionLabel>Audit information</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Created"
                value={formatDate(role.created_at) ?? "—"}
              />
              <Field label="Created by" value="—" />
              <Field
                label="Last updated"
                value={formatDate(role.updated_at) ?? "—"}
              />
              <Field label="Updated by" value="—" />
            </div>
          </section>
        </div>

        {canEdit || canDelete ? (
          <div className="flex items-center gap-2 border-t p-4">
            {canEdit ? (
              <Button className="flex-1" onClick={() => onEdit(role)}>
                <PencilIcon data-icon="inline-start" />
                Edit role
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="outline"
                size="icon"
                aria-label={`Delete ${role.title}`}
                className="border-status-danger-border bg-background text-destructive hover:bg-status-danger-subtle hover:text-destructive"
                onClick={() => onDelete(role)}
              >
                <Trash2Icon />
              </Button>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
