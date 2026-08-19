"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusIcon, SearchIcon, UsersIcon } from "lucide-react";
import * as React from "react";

import { DataToolbar } from "@/components/shared/data-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorAlert } from "@/components/shared/query-states";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { UserDetailSheet } from "@/components/users/user-detail-sheet";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { UserTable } from "@/components/users/user-table";
import { useListSearch } from "@/hooks/use-list-search";
import type { User } from "@/modules/users";
import { userListQuery } from "@/modules/users";

/**
 * Administration → Users, wired to the BFF.
 *
 * Create, edit and role assignment all persist. Deactivate and delete stay
 * visible in the row action menu but disabled — FastAPI's soft delete lives on
 * the model with no controller exposing it, and there is no active/inactive
 * flag on a user at all.
 *
 * Search matches first and last name only — upstream's `$or` covers
 * `firstname` and `lastname` and deliberately leaves `email` out, so an
 * address finds nothing. The placeholder says so rather than implying more.
 *
 * Editing, viewing and role assignment are each gated on their own grant.
 * Creating is not, and cannot be: it posts to `/auth/register`, the one write
 * in this module that carries no `require_permission` upstream — so anyone who
 * can list users can also create one, and hiding the button here would claim a
 * restriction the API does not enforce. It is a backend gap, noted in CLAUDE.md.
 */

/** Overlay currently on top of the list; only one is ever open. */
type Overlay =
  | { kind: "view"; user: User }
  | { kind: "form"; mode: "create" | "edit"; user: User | null }
  | null;

export function UsersPageContent({
  page,
  search,
}: {
  page: number;
  search: string;
}) {
  const [overlay, setOverlay] = React.useState<Overlay>(null);
  const { searchInput, setSearchInput, pageHref } = useListSearch(search);

  const { data, isPending, isError, error } = useQuery(
    userListQuery(page, { search: search || undefined }),
  );

  function openEdit(user: User) {
    setOverlay({ kind: "form", mode: "edit", user });
  }

  return (
    <>
      <PageHeader
        title="Users"
        // Under a search `total_items` is the match count, not the directory
        // size, so the copy says which one it is.
        description={
          data
            ? search
              ? `${data.pagination.total_items} matching`
              : `${data.pagination.total_items} users`
            : undefined
        }
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

      <DataToolbar
        placeholder="Filter by name…"
        filters={[]}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
      />

      {isError ? (
        <ErrorAlert title="Couldn't load users" error={error} />
      ) : isPending ? (
        <TableSkeleton columns={5} />
      ) : data.data.length === 0 ? (
        search ? (
          <EmptyState
            variant="no-results"
            icon={<SearchIcon />}
            title="No matching users"
            description="Try a different name. Searching by email isn't supported."
          />
        ) : (
          <EmptyState
            icon={<UsersIcon />}
            title="No users yet"
            description="People with access to this procurement module will appear here. Use New user to create the first account."
          />
        )
      ) : (
        <UserTable
          users={data.data}
          page={data.pagination}
          buildPageHref={pageHref}
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
