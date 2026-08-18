import type { Metadata } from "next";

import { EditPurchaseRequestForm } from "@/components/purchase-requests/edit-pr-form";
import { NoAccess } from "@/components/shared/no-access";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { canAccess } from "@/modules/auth/dal/access";

export const metadata: Metadata = {
  title: "Edit Purchase Request",
};

export default async function EditPurchaseRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!(await canAccess(PERMISSIONS.purchaseRequest.update))) {
    return (
      <NoAccess
        title="Edit Purchase Request"
        resource="the editor for this purchase request"
      />
    );
  }

  return <EditPurchaseRequestForm id={id} />;
}
