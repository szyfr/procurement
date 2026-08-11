import type { Metadata } from "next";

import { UsersPageContent } from "@/components/users/users-page-content";

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

  return <UsersPageContent page={activePage} />;
}
