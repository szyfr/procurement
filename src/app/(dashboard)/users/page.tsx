import type { Metadata } from "next";

import { NoAccess } from "@/components/shared/no-access";
import { UsersPageContent } from "@/components/users/users-page-content";
import { PERMISSIONS } from "@/modules/auth/constants/permissions";
import { canAccess } from "@/modules/auth/dal/access";

export const metadata: Metadata = {
  title: "Users",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const activePage = Math.max(Number(page) || 1, 1);

  if (!(await canAccess(PERMISSIONS.user.index))) {
    return <NoAccess title="Users" resource="the user directory" />;
  }

  return <UsersPageContent page={activePage} />;
}
