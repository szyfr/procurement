"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusIcon, UsersIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorAlert } from "@/components/shared/query-states";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { UserDetailSheet } from "@/components/users/user-detail-sheet";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { UserTable } from "@/components/users/user-table";
import { buildPageHref } from "@/lib/page-href";
import type { User } from "@/modules/users";
import { userListQuery } from "@/modules/users";

/**
 * Administration → Users, wired to the BFF.
 *
 * Create, edit and role assignment all persist. Deactivate and delete stay
 * visible in the row action menu but disabled — FastAPI's soft delete lives on
 * the model with no controller exposing it, and there is no active/inactive
 * flag on a user at all.
 */

/** Overlay currently on top of the list; only one is ever open. */
type Overlay =
  | { kind: "view"; user: User }
  | { kind: "form"; mode: "create" | "edit"; user: User | null }
  | null;

export function UsersPageContent({ page }: { page: number }) {
  const pathname = usePathname();

  const [overlay, setOverlay] = React.useState<Overlay>(null);

  const { data, isPending, isError, error } = useQuery(userListQuery(page));

  function openEdit(user: User) {
    setOverlay({ kind: "form", mode: "edit", user });
  }

  return (
    <>
      <PageHeader
        title="Users"
        description={data ? `${data.pagination.total_items} users` : undefined}
        actions={
          <Button
            onClick={() =>
              setOverlay({ kind: "form", mode: "create", user: null })
            }
          >
            <PlusIcon data-icon="inline-start" />
            New user
          </Button>
        }
      />

      {isError ? (
        <ErrorAlert title="Couldn't load users" error={error} />
      ) : isPending ? (
        <TableSkeleton columns={5} />
      ) : data.data.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="No users yet"
          description="People with access to this procurement module will appear here. Use New user to create the first account."
        />
      ) : (
        <UserTable
          users={data.data}
          page={data.pagination}
          buildPageHref={(next) => buildPageHref(pathname, next)}
          openUserId={overlay?.kind === "view" ? overlay.user._id : null}
          onView={(user) => setOverlay({ kind: "view", user })}
          onEdit={openEdit}
        />
      )}

      <UserDetailSheet
        user={overlay?.kind === "view" ? overlay.user : null}
        open={overlay?.kind === "view"}
        onOpenChange={(open) => {
          if (!open) setOverlay(null);
        }}
        onEdit={openEdit}
      />

      <UserFormDialog
        open={overlay?.kind === "form"}
        onOpenChange={(open) => {
          if (!open) setOverlay(null);
        }}
        mode={overlay?.kind === "form" ? overlay.mode : "create"}
        user={overlay?.kind === "form" ? overlay.user : null}
      />
    </>
  );
}
