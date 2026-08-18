"use client";

import { useQuery } from "@tanstack/react-query";
import { PencilIcon, UserCogIcon } from "lucide-react";
import * as React from "react";

import { useCan } from "@/components/providers/permissions-provider";
import { ErrorAlert } from "@/components/shared/query-states";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { AssignRolesDialog } from "@/components/users/assign-roles-dialog";
import { formatDate } from "@/lib/date";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import type { User } from "@/modules/users";
import { userDetailQuery } from "@/modules/users";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function SectionLabel(props: React.ComponentProps<"p">) {
  return (
    <p
      className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase"
      {...props}
    />
  );
}

/**
 * Read-only summary of one user, opened by clicking its row.
 *
 * The list row only carries the bare identity fields, so the sheet fetches
 * `GET /users/{id}` itself to get the joined role documents it needs to
 * render as badges. Last login has no backend source at all and renders as a
 * literal em-dash.
 */
export function UserDetailSheet({
  user,
  open,
  onOpenChange,
  onEdit,
}: {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (user: User) => void;
}) {
  const canEdit = useCan(PERMISSIONS.user.update);
  const canAssignRoles = useCan(PERMISSIONS.userRole.attach);

  const { data, isPending, isError, error } = useQuery({
    ...userDetailQuery(user?._id ?? ""),
    enabled: open && Boolean(user),
  });

  const [assigningRoles, setAssigningRoles] = React.useState(false);

  if (!user) return null;

  const name = `${user.firstname} ${user.lastname}`;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        {/* The side-scoped widths have to be overridden on the same selector, or
            the base `data-[side=right]:w-3/4` outranks a plain `w-` utility. */}
        <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-[470px] data-[side=right]:sm:max-w-[470px]">
          <SheetHeader className="gap-1 border-b p-4 pr-24">
            <SheetDescription className="font-mono text-xs">
              {user.email}
            </SheetDescription>
            <SheetTitle>{name}</SheetTitle>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
            {isError ? (
              <ErrorAlert title="Couldn't load user details" error={error} />
            ) : null}

            <section className="flex flex-col gap-3">
              <SectionLabel>Identity</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name" value={user.firstname} />
                <Field label="Last name" value={user.lastname} />
                <Field label="Email" value={user.email} />
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <SectionLabel>Assigned roles</SectionLabel>
                {canAssignRoles ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => setAssigningRoles(true)}
                  >
                    <UserCogIcon data-icon="inline-start" />
                    Assign roles
                  </Button>
                ) : null}
              </div>
              {isPending ? (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 2 }, (_, chip) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder chips
                    <Skeleton key={chip} className="h-5 w-20 rounded-sm" />
                  ))}
                </div>
              ) : data && data.roles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.roles.map((role) => (
                    <StatusBadge key={role._id} tone="info">
                      {role.title}
                    </StatusBadge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  This user has no roles assigned.
                </p>
              )}
            </section>

            <section className="flex flex-col gap-2">
              <SectionLabel>Audit information</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Created"
                  value={formatDate(user.created_at) ?? "—"}
                />
                <Field label="Last login" value="—" />
                <Field
                  label="Last updated"
                  value={formatDate(user.updated_at) ?? "—"}
                />
                <Field label="Updated by" value="—" />
              </div>
            </section>
          </div>

          {canEdit ? (
            <div className="border-t p-4">
              <Button className="w-full" onClick={() => onEdit(user)}>
                <PencilIcon data-icon="inline-start" />
                Edit user
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <AssignRolesDialog
        open={assigningRoles}
        onOpenChange={setAssigningRoles}
        userId={user._id}
        userName={name}
        assignedRoleIds={data?.roles.map((role) => role._id) ?? []}
      />
    </>
  );
}
