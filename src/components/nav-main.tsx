"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { usePermissions } from "@/components/providers/permissions-provider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { PermissionSlug } from "@/modules/auth/constants/permissions";
import { hasAnyPermission } from "@/modules/auth/models/access";

export interface NavItem {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  items?: { title: string; url: string }[];
  /** Any one of these grants shows the entry; omitted means always shown. */
  requires?: readonly PermissionSlug[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Nav rows sit a step quieter than body text — muted until hovered or active —
 * so the sidebar reads as navigation rather than competing with the page.
 */
const navItemClass =
  "h-[34px] gap-2.5 rounded-md px-2 text-[13.5px] font-medium text-muted-foreground data-active:text-foreground [&_svg]:size-[18px]";

export function NavMain({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const granted = usePermissions();

  /** A section is active for its own route and anything nested under it. */
  const isActive = (url: string) =>
    pathname === url || pathname.startsWith(`${url}/`);

  // A group whose every entry was filtered out drops with them, rather than
  // leaving a heading over nothing — ADMINISTRATION is entirely gated, so an
  // ordinary requester would otherwise see a bare label.
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.requires || hasAnyPermission(granted, item.requires),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      {visibleGroups.map((group) => (
        <SidebarGroup key={group.title} className="gap-0.5 py-0">
          <SidebarGroupLabel className="h-auto px-2 pt-3.5 pb-1.5 text-[10.5px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            {group.title}
          </SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              const Icon = item.icon;

              // Leaf item — render a plain link rather than a collapsible section.
              if (!item.items?.length) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive(item.url)}
                      className={navItemClass}
                      render={<Link href={item.url} />}
                    >
                      {Icon ? <Icon /> : null}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              return (
                <Collapsible
                  key={item.title}
                  defaultOpen={isActive(item.url)}
                  className="group/collapsible"
                  render={<SidebarMenuItem />}
                >
                  <CollapsibleTrigger
                    render={
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={navItemClass}
                      />
                    }
                  >
                    {Icon ? <Icon /> : null}
                    <span>{item.title}</span>
                    <ChevronRightIcon className="ml-auto size-[15px]! transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="gap-0.5 py-1">
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            isActive={pathname === subItem.url}
                            className="h-[30px] rounded-md text-[13px] text-muted-foreground data-active:font-medium data-active:text-foreground"
                            render={<Link href={subItem.url} />}
                          >
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
