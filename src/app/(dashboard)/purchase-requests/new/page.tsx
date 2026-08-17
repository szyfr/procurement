import type { Metadata } from "next";

import { NewPurchaseRequestForm } from "@/components/purchase-requests/new-pr-form";
import { NoAccess } from "@/components/shared/no-access";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { canAccess } from "@/modules/auth/dal/access";

export const metadata: Metadata = {
  title: "New Purchase Request",
};

export default async function NewPurchaseRequestPage() {
  if (!(await canAccess(PERMISSIONS.purchaseRequest.store))) {
    // Reading requests and raising one are separate grants upstream, so
    // landing here without `purchase_request.store` is an ordinary outcome.
    return (
      <NoAccess
        title="New Purchase Request"
        resource="the form for raising a purchase request"
      />
    );
  }

  return <NewPurchaseRequestForm />;
}
