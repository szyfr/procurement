import type { Metadata } from "next";

import { RolesPageContent } from "@/components/roles/roles-page-content";

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

  return <RolesPageContent page={activePage} search={q ?? ""} />;
}
