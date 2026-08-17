"use client";

import { ChevronsUpDownIcon, LogOutIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { dropdownItemClass } from "@/components/shared/menu-classes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { initials } from "@/lib/utils";
import { type AuthenticatedUser, useLogout, userName } from "@/modules/auth";

export function NavUser({ user }: { user: AuthenticatedUser }) {
  const name = userName(user);
  const { isMobile } = useSidebar();
  const logout = useLogout();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="h-auto gap-2.5 rounded-md p-1.5 aria-expanded:bg-muted"
              />
            }
          >
            {/* No avatar source: `/auth/me` carries no image, so initials are
                the whole identity mark. */}
            <Avatar className="size-[30px]">
              <AvatarFallback className="text-[11px] font-semibold">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-[13px] font-medium">{name}</span>
              {/* The backend has no role on the user record yet, only a
                  permission list — the email identifies the account instead. */}
              <span className="truncate text-[11px] text-muted-foreground">
                {user.email}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg p-[5px] shadow-md"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarFallback>{initials(name)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* One destination, one entry: "Settings" pointed at the same
                account panel as "My Account", and there is no second settings
                page for it to ever mean anything else. */}
            <DropdownMenuGroup>
              <DropdownMenuItem
                className={dropdownItemClass}
                render={<Link href="/settings/account" />}
              >
                <UserIcon />
                My Account
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* A real request, not a link: the session cookie is HttpOnly, so
                only the BFF can clear it. */}
            <DropdownMenuItem
              variant="destructive"
              className={dropdownItemClass}
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              <LogOutIcon />
              {logout.isPending ? "Logging out…" : "Log Out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
