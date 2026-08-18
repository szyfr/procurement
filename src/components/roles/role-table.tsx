"use client";

import {
  EyeIcon,
  MoreVerticalIcon,
  PencilIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react";

import { useCan } from "@/components/providers/permissions-provider";
import {
  dropdownContentClass,
  dropdownItemClass,
} from "@/components/shared/menu-classes";
import { dataTableClass } from "@/components/shared/table-classes";
import { TablePagination } from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Pagination } from "@/lib/api/pagination";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import type { Role } from "@/modules/roles";

/**
 * The roles list. The whole row opens the read-only sheet; the actions menu
 * stops the click from reaching it so a menu item never opens both.
 *
 * Assigned users, permissions and status are deliberately not columns here for
 * now — the backend has no assignee or status data for a role at all, and the
 * grant count belongs to the detail sheet rather than the list.
 */
export function RoleTable({
  roles,
  page,
  buildPageHref,
  openRoleId,
  onView,
  onEdit,
  onDelete,
}: {
  roles: Role[];
  page: Pagination;
  buildPageHref: (page: number) => string;
  /** Row left tinted while its sheet is open. */
  openRoleId?: string | null;
  onView: (role: Role) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}) {
  // The sheet reads `GET /roles/{id}` for the granted permissions, so viewing
  // is its own grant rather than something the list read implies.
  const canViewDetails = useCan(PERMISSIONS.role.show);
  const canEdit = useCan(PERMISSIONS.role.update);
  const canDelete = useCan(PERMISSIONS.role.delete);
  const showActions = canViewDetails || canEdit || canDelete;

  return (
    <Card>
      <CardContent className="px-0">
        <Table className={cn("min-w-[640px]", dataTableClass)}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="w-[30%]">
                Role
              </TableHead>
              <TableHead scope="col">Description</TableHead>
              <TableHead scope="col" className="w-[140px]">
                Last updated
              </TableHead>
              <TableHead scope="col" className="w-[56px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow
                key={role._id}
                className={cn(
                  "hover:bg-accent aria-selected:bg-accent",
                  canViewDetails && "cursor-pointer",
                )}
                aria-selected={openRoleId === role._id}
                onClick={canViewDetails ? () => onView(role) : undefined}
              >
                <TableCell className="align-middle">
                  <div className="flex items-start gap-2.5">
                    <span
                      aria-hidden
                      className="mt-0.5 flex size-6.5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                    >
                      <ShieldIcon className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <span className="truncate font-semibold">
                        {role.title}
                      </span>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        —
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="align-middle">
                  <p className="text-xs leading-[1.45] text-pretty whitespace-normal text-muted-foreground">
                    {role.description}
                  </p>
                </TableCell>
                <TableCell className="align-middle">
                  <p className="text-xs">
                    {formatDate(role.updated_at) ?? "—"}
                  </p>
                </TableCell>
                <TableCell className="align-middle">
                  <div className="flex justify-end">
                    {showActions ? (
                      <DropdownMenu>
                        {/* The menu lives in a portal, so only the trigger's own
                            click can reach the row and open the sheet behind it. */}
                        <DropdownMenuTrigger
                          onClick={(event) => event.stopPropagation()}
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${role.title}`}
                            />
                          }
                        >
                          <MoreVerticalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className={cn(dropdownContentClass, "min-w-[196px]")}
                        >
                          {canViewDetails ? (
                            <DropdownMenuItem
                              className={dropdownItemClass}
                              onClick={() => onView(role)}
                            >
                              <EyeIcon />
                              View details
                            </DropdownMenuItem>
                          ) : null}
                          {canEdit ? (
                            <DropdownMenuItem
                              className={dropdownItemClass}
                              onClick={() => onEdit(role)}
                            >
                              <PencilIcon />
                              Edit role
                            </DropdownMenuItem>
                          ) : null}
                          {canDelete ? (
                            <>
                              {canViewDetails || canEdit ? (
                                <DropdownMenuSeparator />
                              ) : null}
                              <DropdownMenuItem
                                variant="destructive"
                                className={dropdownItemClass}
                                onClick={() => onDelete(role)}
                              >
                                <Trash2Icon />
                                Delete role
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <TablePagination
        shown={roles.length}
        page={page}
        buildPageHref={buildPageHref}
      />
    </Card>
  );
}
