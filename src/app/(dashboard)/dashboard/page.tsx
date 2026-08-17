import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { canAccess } from "@/modules/auth/dal/access";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Never gated as a whole: it is where sign-in lands, so a user with no grants
 * at all still gets a page rather than a dead end. Its panels gate themselves.
 */
export default async function DashboardPage() {
  const canCreate = await canAccess(PERMISSIONS.purchaseRequest.store);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your procurement workload"
        actions={
          canCreate ? (
            <Button
              variant="outline"
              render={<Link href="/purchase-requests/new" />}
              nativeButton={false}
            >
              <PlusIcon data-icon="inline-start" />
              New Purchase Request
            </Button>
          ) : null
        }
      />

      <DashboardView />
    </>
  );
}
