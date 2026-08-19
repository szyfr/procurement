import type { Metadata } from "next";

import { DepartmentsPageContent } from "@/components/departments/departments-page-content";
import { NoAccess } from "@/components/shared/no-access";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { canAccess } from "@/modules/auth/dal/access";

export const metadata: Metadata = {
  title: "Departments",
};

/** Create and edit happen inline via dialogs rather than dedicated routes. */
export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { page, search } = await searchParams;
  const activePage = Math.max(Number(page) || 1, 1);

  if (!(await canAccess(PERMISSIONS.department.index))) {
    return <NoAccess title="Departments" resource="departments" />;
  }

  return <DepartmentsPageContent page={activePage} search={search ?? ""} />;
}
