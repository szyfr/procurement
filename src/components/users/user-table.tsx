"use client";

import {
  EyeIcon,
  MoreVerticalIcon,
  PencilIcon,
  Trash2Icon,
  UserRoundIcon,
  UserXIcon,
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
import type { User } from "@/modules/users";

/**
 * The users list. The whole row opens the read-only sheet; the actions menu
 * stops the click from reaching it so a menu item never opens both.
 *
 * Deactivate and delete stay in the menu but disabled: FastAPI's soft delete
 * is on the model with no controller behind it, and a user document carries no
 * active/inactive flag.
 */
export function UserTable({
  users,
  page,
  buildPageHref,
  openUserId,
  onView,
  onEdit,
}: {
  users: User[];
  page: Pagination;
  buildPageHref: (page: number) => string;
  /** Row left tinted while its sheet is open. */
  openUserId?: string | null;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
}) {
  // The sheet reads `GET /users/{id}` for the joined roles, which is its own
  // grant — without it the row is inert and only the menu's writes remain.
  const canViewDetails = useCan(PERMISSIONS.user.show);
  const canEdit = useCan(PERMISSIONS.user.update);

  return (
    <Card>
      <CardContent className="px-0">
        <Table className={cn("min-w-[620px]", dataTableClass)}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="w-[32%]">
                Name
              </TableHead>
              <TableHead scope="col" className="w-[36%]">
                Email
              </TableHead>
              <TableHead scope="col" className="w-[140px]">
                Created
              </TableHead>
              <TableHead scope="col" className="w-[140px]">
                Updated
              </TableHead>
              <TableHead scope="col" className="w-[56px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const name = `${user.firstname} ${user.lastname}`;

              return (
                <TableRow
                  key={user._id}
                  className={cn(
                    "hover:bg-accent aria-selected:bg-accent",
                    canViewDetails && "cursor-pointer",
                  )}
                  aria-selected={openUserId === user._id}
                  onClick={canViewDetails ? () => onView(user) : undefined}
                >
                  <TableCell className="align-middle">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className="flex size-6.5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                      >
                        <UserRoundIcon className="size-3.5" />
                      </span>
                      <span className="truncate font-semibold">{name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="align-middle text-xs text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="align-middle">
                    <p className="text-xs">
                      {formatDate(user.created_at) ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell className="align-middle">
                    <p className="text-xs">
                      {formatDate(user.updated_at) ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="flex justify-end">
                      <DropdownMenu>
                        {/* The menu lives in a portal, so only the trigger's own
                            click can reach the row and open the sheet behind it. */}
                        <DropdownMenuTrigger
                          onClick={(event) => event.stopPropagation()}
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${name}`}
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
                              onClick={() => onView(user)}
                            >
                              <EyeIcon />
                              View details
                            </DropdownMenuItem>
                          ) : null}
                          {canEdit ? (
                            <DropdownMenuItem
                              className={dropdownItemClass}
                              onClick={() => onEdit(user)}
                            >
                              <PencilIcon />
                              Edit user
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            className={dropdownItemClass}
                            disabled
                          >
                            <UserXIcon />
                            Deactivate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            className={dropdownItemClass}
                            disabled
                          >
                            <Trash2Icon />
                            Delete user
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      <TablePagination
        shown={users.length}
        page={page}
        buildPageHref={buildPageHref}
      />
    </Card>
  );
}
