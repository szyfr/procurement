import { DashboardBreadcrumbs } from "@/components/dashboard/dashboard-breadcrumbs";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { NotificationsMenu } from "@/components/dashboard/notifications-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b bg-background">
      <div className="flex w-full items-center gap-2 px-5">
        <SidebarTrigger className="-ml-1.5 size-8" />
        <Separator
          orientation="vertical"
          className="mr-1 data-vertical:h-4 data-vertical:self-auto"
        />
        <DashboardBreadcrumbs />
        {/* Search is a fixed 260px rail rather than an elastic column, so the
            breadcrumb keeps the same start position on every page. */}
        <GlobalSearch className="ml-auto w-full max-w-[260px]" />
        <NotificationsMenu />
      </div>
    </header>
  );
}
