"use client";

import { useQuery } from "@tanstack/react-query";
import { UsersIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorAlert } from "@/components/shared/query-states";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { UserDetailSheet } from "@/components/users/user-detail-sheet";
import { UserTable } from "@/components/users/user-table";
import { buildPageHref } from "@/lib/page-href";
import type { User } from "@/modules/users";
import { userListQuery } from "@/modules/users";

/**
 * Administration → Users, wired to the BFF.
 *
 * Role assignment is the only write FastAPI exposes for users, and it happens
 * from the detail sheet — invite, edit, deactivate and delete stay visible in
 * the row action menu but disabled until their endpoints exist.
 */
export function UsersPageContent({ page }: { page: number }) {
  const pathname = usePathname();

  const [viewUser, setViewUser] = React.useState<User | null>(null);

  const { data, isPending, isError, error } = useQuery(userListQuery(page));

  return (
    <>
      <PageHeader
        title="Users"
        description={data ? `${data.pagination.total_items} users` : undefined}
      />

      {isError ? (
        <ErrorAlert title="Couldn't load users" error={error} />
      ) : isPending ? (
        <TableSkeleton columns={7} />
      ) : data.data.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="No users yet"
          description="People with access to this procurement module will appear here."
        />
      ) : (
        <UserTable
          users={data.data}
          page={data.pagination}
          buildPageHref={(next) => buildPageHref(pathname, next)}
          openUserId={viewUser?._id}
          onView={setViewUser}
        />
      )}

      <UserDetailSheet
        user={viewUser}
        open={viewUser !== null}
        onOpenChange={(open) => {
          if (!open) setViewUser(null);
        }}
      />
    </>
  );
}
