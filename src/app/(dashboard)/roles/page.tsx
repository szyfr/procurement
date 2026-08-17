import type { Metadata } from "next";

import { RolesPageContent } from "@/components/roles/roles-page-content";
import { NoAccess } from "@/components/shared/no-access";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { canAccess } from "@/modules/auth/dal/access";

export const metadata: Metadata = {
  title: "Roles & Permissions",
};

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page, q } = await searchParams;
  const activePage = Math.max(Number(page) || 1, 1);

  if (!(await canAccess(PERMISSIONS.role.index))) {
    return (
      <NoAccess title="Roles & Permissions" resource="roles and permissions" />
    );
  }

  return <RolesPageContent page={activePage} search={q ?? ""} />;
}
