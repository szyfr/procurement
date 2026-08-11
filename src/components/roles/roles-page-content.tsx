"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusIcon, SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { DeleteRoleDialog } from "@/components/roles/delete-role-dialog";
import { RoleDetailSheet } from "@/components/roles/role-detail-sheet";
import { RoleFormDialog } from "@/components/roles/role-form-dialog";
import {
  RolesEmpty,
  RolesError,
  RolesLoading,
  RolesNoResults,
} from "@/components/roles/role-list-states";
import { RoleTable } from "@/components/roles/role-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { buildPageHref } from "@/lib/page-href";
import { permissionListQuery } from "@/modules/permissions";
import type { Role } from "@/modules/roles";
import { roleListQuery } from "@/modules/roles";

/**
 * Administration → Roles & Permissions. Create and edit persist through the
 * BFF; delete stays a dead end, since FastAPI has no delete endpoint for roles
 * yet and the dialog disables the destructive action rather than hiding it.
 */

const SEARCH_DEBOUNCE_MS = 300;

/** Overlay currently on top of the list; only one is ever open. */
type Overlay =
  | { kind: "view"; role: Role }
  | { kind: "form"; mode: "create" | "edit"; role: Role | null }
  | { kind: "delete"; role: Role }
  | null;

export function RolesPageContent({
  page,
  search,
}: {
  page: number;
  search: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [overlay, setOverlay] = React.useState<Overlay>(null);
  const [searchInput, setSearchInput] = React.useState(search);

  // Keeps the field in sync when the URL changes elsewhere, e.g. back navigation.
  React.useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: only typing should reset the debounce timer — reacting to `search` or `updateParams` here would restart it every URL change.
  React.useEffect(() => {
    if (searchInput === search) return;

    const timeout = setTimeout(() => {
      updateParams({ q: searchInput || null, page: null });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const {
    data,
    isPending,
    isError,
    refetch: refetchRoles,
  } = useQuery(roleListQuery(page, search));

  // Cheap, page-size-1 calls: only the `pagination.total_items` count is
  // needed, not the rows themselves.
  const { data: permissionsTotal } = useQuery(permissionListQuery(1, 1));
  const totalPermissions = permissionsTotal?.pagination.total_items ?? 0;

  const { data: unfilteredRoles } = useQuery({
    ...roleListQuery(1, ""),
    enabled: Boolean(search),
  });

  function openCreate() {
    setOverlay({ kind: "form", mode: "create", role: null });
  }

  function openEdit(role: Role) {
    setOverlay({ kind: "form", mode: "edit", role });
  }

  function clearFilters() {
    setSearchInput("");
    updateParams({ q: null, page: null });
  }

  function pageHref(next: number) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    return buildPageHref(pathname, next, params);
  }

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description={
          data
            ? `${data.pagination.total_items} roles · ${totalPermissions} permissions`
            : undefined
        }
        actions={
          <Button onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            New role
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="w-full sm:w-[290px]">
          <InputGroupInput
            type="search"
            value={searchInput}
            placeholder="Search roles…"
            aria-label="Search roles"
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </div>

      {isError ? (
        <RolesError onRetry={() => refetchRoles()} />
      ) : isPending ? (
        <RolesLoading />
      ) : data.data.length === 0 ? (
        search ? (
          <RolesNoResults
            query={search}
            totalRoles={unfilteredRoles?.pagination.total_items ?? 0}
            onClear={clearFilters}
          />
        ) : (
          <RolesEmpty onCreate={openCreate} />
        )
      ) : (
        <RoleTable
          roles={data.data}
          page={data.pagination}
          buildPageHref={pageHref}
          totalPermissions={totalPermissions}
          openRoleId={overlay?.kind === "view" ? overlay.role._id : null}
          onView={(role) => setOverlay({ kind: "view", role })}
          onEdit={openEdit}
          onDelete={(role) => setOverlay({ kind: "delete", role })}
        />
      )}

      <RoleDetailSheet
        role={overlay?.kind === "view" ? overlay.role : null}
        open={overlay?.kind === "view"}
        onOpenChange={(open) => {
          if (!open) setOverlay(null);
        }}
        onEdit={openEdit}
        onDelete={(role) => setOverlay({ kind: "delete", role })}
        totalPermissions={totalPermissions}
      />

      <RoleFormDialog
        open={overlay?.kind === "form"}
        onOpenChange={(open) => {
          if (!open) setOverlay(null);
        }}
        mode={overlay?.kind === "form" ? overlay.mode : "create"}
        role={overlay?.kind === "form" ? overlay.role : null}
      />

      <DeleteRoleDialog
        role={overlay?.kind === "delete" ? overlay.role : null}
        open={overlay?.kind === "delete"}
        onOpenChange={(open) => {
          if (!open) setOverlay(null);
        }}
      />
    </>
  );
}
