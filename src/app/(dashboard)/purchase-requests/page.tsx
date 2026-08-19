import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { PurchaseRequestListView } from "@/components/purchase-requests/pr-list-view";
import {
  LIST_VIEW_COOKIE,
  type ListView,
  parseListView,
} from "@/components/purchase-requests/view-preference";
import { ViewToggle } from "@/components/purchase-requests/view-toggle";
import { NoAccess } from "@/components/shared/no-access";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { canAccess } from "@/modules/auth/dal/access";

export const metadata: Metadata = {
  title: "Purchase Requests",
};

export default async function PurchaseRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    page?: string;
    search?: string;
    status?: string;
    priority?: string;
    departments?: string;
  }>;
}) {
  const [{ view, page, search, status, priority, departments }, cookieStore] =
    await Promise.all([searchParams, cookies()]);

  // The URL wins, so a shared link opens the view it names. Only a visit that
  // asks for nothing falls back to the remembered choice, and cards when there
  // is none.
  const activeView: ListView =
    parseListView(view) ??
    parseListView(cookieStore.get(LIST_VIEW_COOKIE)?.value) ??
    "cards";
  const activePage = Math.max(Number(page) || 1, 1);

  if (!(await canAccess(PERMISSIONS.purchaseRequest.index))) {
    return <NoAccess title="Purchase Requests" resource="purchase requests" />;
  }

  // Reading the list and raising a request are separate grants upstream, so
  // someone who can only follow along gets the list without the button.
  const canCreate = await canAccess(PERMISSIONS.purchaseRequest.store);

  return (
    <>
      <PageHeader
        title="Purchase Requests"
        description="Track every request from draft through delivery"
        actions={
          <>
            <ViewToggle view={activeView} />
            {canCreate ? (
              <Button
                variant="outline"
                render={<Link href="/purchase-requests/new" />}
                nativeButton={false}
              >
                <PlusIcon data-icon="inline-start" />
                New Purchase Request
              </Button>
            ) : null}
          </>
        }
      />

      <PurchaseRequestListView
        view={activeView}
        page={activePage}
        search={search ?? ""}
        status={status ?? ""}
        priority={priority ?? ""}
        departments={departments ?? ""}
      />
    </>
  );
}
