import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PurchaseRequestListView } from "@/components/purchase-requests/pr-list-view";
import {
  type ListView,
  ViewToggle,
} from "@/components/purchase-requests/view-toggle";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

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
  const { view, page, search, status, priority, departments } =
    await searchParams;
  const activeView: ListView = view === "table" ? "table" : "cards";
  const activePage = Math.max(Number(page) || 1, 1);

  return (
    <>
      <PageHeader
        title="Purchase Requests"
        description="Track every request from draft through delivery"
        actions={
          <>
            <ViewToggle view={activeView} />
            <Button
              variant="outline"
              render={<Link href="/purchase-requests/new" />}
              nativeButton={false}
            >
              <PlusIcon data-icon="inline-start" />
              New Purchase Request
            </Button>
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
