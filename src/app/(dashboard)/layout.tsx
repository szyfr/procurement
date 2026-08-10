import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import { AblyRealtimeProvider } from "@/components/providers/ably-provider";
import { PurchaseRequestsChannelProvider } from "@/components/providers/purchase-requests-channel-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LOGIN_PATH } from "@/modules/auth/constants";
import { getOptionalUser } from "@/modules/auth/dal/auth.dal";

/**
 * The authoritative half of route protection.
 *
 * `proxy.ts` only knows whether a session cookie exists; this asks FastAPI
 * whether it still means anything, which is the check that catches an expired
 * or revoked token. Doing it in the layout covers every page in the group at
 * the layer closest to the data, and it is also where the sidebar's user comes
 * from — read from the backend rather than decoded from the cookie.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalUser();

  // No `?next=`: the login page verifies the session itself, so a stale cookie
  // that got past the proxy ends here rather than bouncing between the two.
  if (!user) redirect(LOGIN_PATH);

  return (
    <AblyRealtimeProvider>
      {/* Registers the channel every purchase-request view listens on, above
          both the list and detail views since either can mount the hook. */}
      <PurchaseRequestsChannelProvider>
        <SidebarProvider>
          <AppSidebar user={user} />
          {/* SidebarInset is the <main> landmark, so children go in a plain div.
              min-w-0 lets wide tables scroll inside their own container instead of
              stretching the flex track past the viewport. */}
          <SidebarInset className="min-w-0">
            <SiteHeader />
            <div className="flex min-w-0 flex-1 flex-col gap-5 p-4 md:p-6">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </PurchaseRequestsChannelProvider>
    </AblyRealtimeProvider>
  );
}
