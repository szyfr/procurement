import type { Metadata } from "next";

import { DepartmentsPageContent } from "@/components/departments/departments-page-content";

export const metadata: Metadata = {
  title: "Departments",
};

/** Create and edit happen inline via dialogs rather than dedicated routes. */
export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const activePage = Math.max(Number(page) || 1, 1);

  return <DepartmentsPageContent page={activePage} />;
}
