"use client";

import { HandCoinsIcon } from "lucide-react";

import {
  type EntityCrudConfig,
  EntityPageContent,
} from "@/components/shared/entity-crud";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import {
  type CreatePaymentTermDto,
  createPaymentTerm,
  deletePaymentTerm,
  type PaymentTerm,
  paymentTermKeys,
  paymentTermListQuery,
  updatePaymentTerm,
} from "@/modules/payment-terms";

const config: EntityCrudConfig<PaymentTerm, CreatePaymentTermDto> = {
  entityLabel: "Payment Term",
  titlePlaceholder: 'e.g. "Full Payment"',
  descriptionPlaceholder: 'e.g. "Fully paying the vendor (cash or cheque)"',
  emptyStateIcon: <HandCoinsIcon />,
  emptyStateTitle: "No payment terms yet",
  emptyStateDescription:
    "Create one to make it available when creating a quotation.",
  searchPlaceholder: "Filter payment terms…",
  pageTitle: "Payment Terms",
  pageDescription:
    "Manage the payment terms available when creating a quotation",
  createDescription:
    "Add a payment term that can be selected when creating a quotation.",
  newButtonLabel: "New Payment Term",
  // All three are `payment_term.store`: the controller reuses that slug on
  // update and delete, and no `.update`/`.delete` permission exists upstream.
  permissions: {
    create: PERMISSIONS.paymentTerm.write,
    update: PERMISSIONS.paymentTerm.write,
    remove: PERMISSIONS.paymentTerm.write,
  },
  queryKeys: paymentTermKeys,
  listQuery: paymentTermListQuery,
  create: createPaymentTerm,
  update: updatePaymentTerm,
  remove: deletePaymentTerm,
};

export function PaymentTermsPageContent({
  page,
  search,
}: {
  page: number;
  search: string;
}) {
  return <EntityPageContent page={page} search={search} config={config} />;
}
