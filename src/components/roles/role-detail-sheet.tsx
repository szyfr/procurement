"use client";

import { useQuery } from "@tanstack/react-query";
import { PencilIcon, Trash2Icon } from "lucide-react";

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
import { formatDate } from "@/lib/date";
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

/**
 * Read-only summary of one role, opened by clicking its row.
 *
 * The list row only carries `permission_ids`, so the sheet fetches
 * `GET /roles/{id}` itself to get the joined permission documents (title +
 * description) it needs to render the grant list.
 */
export function RoleDetailSheet({
  role,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  totalPermissions,
}: {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  totalPermissions: number;
}) {
  const { data, isPending, isError, error } = useQuery({
    ...roleDetailQuery(role?._id ?? ""),
    enabled: open && Boolean(role),
  });

  if (!role) return null;

  const granted = data?.permissions.length ?? role.permission_ids.length;

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
              <Field label="Assigned users" value="—" />
            </div>
          </section>

          <section className="flex flex-col gap-2.5">
            <SectionLabel>Permission summary</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border px-2.5 py-2">
                <p className="text-xs text-muted-foreground">Granted</p>
                <p className="text-base font-semibold tabular-nums">
                  {granted}
                </p>
              </div>
              <div className="rounded-lg border px-2.5 py-2">
                <p className="text-xs text-muted-foreground">Of total</p>
                <p className="text-base font-semibold tabular-nums">
                  {totalPermissions}
                </p>
              </div>
              <div className="rounded-lg border px-2.5 py-2">
                <p className="text-xs text-muted-foreground">Modules</p>
                <p className="text-base font-semibold tabular-nums">—</p>
              </div>
            </div>
            <Progress
              value={
                totalPermissions > 0 ? (granted / totalPermissions) * 100 : 0
              }
              aria-label={`${granted} of ${totalPermissions} permissions granted`}
              className="gap-0 [&_[data-slot=progress-track]]:h-2"
            />
          </section>

          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <SectionLabel>Granted permissions</SectionLabel>
              <span className="text-xs text-muted-foreground tabular-nums">
                {granted}
              </span>
            </div>
            {isPending ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }, (_, row) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder rows
                  <Skeleton key={row} className="h-9 w-full" />
                ))}
              </div>
            ) : data && data.permissions.length > 0 ? (
              <ul>
                {data.permissions.map((permission) => (
                  <li
                    key={permission._id}
                    className="flex flex-col gap-0.5 border-b py-2 last:border-0"
                  >
                    <p className="font-medium">{permission.description}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {permission.title}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                This role has no permissions granted.
              </p>
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

        <div className="flex items-center gap-2 border-t p-4">
          <Button className="flex-1" onClick={() => onEdit(role)}>
            <PencilIcon data-icon="inline-start" />
            Edit role
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={`Delete ${role.title}`}
            className="border-status-danger-border bg-background text-destructive hover:bg-status-danger-subtle hover:text-destructive"
            onClick={() => onDelete(role)}
          >
            <Trash2Icon />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
