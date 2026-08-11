import type { Metadata } from "next";

import { CanvassingListView } from "@/components/canvassing/canvassing-list-view";
import { DataToolbar } from "@/components/shared/data-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { departments } from "@/data/reference";
import { canvassingStatusOptions } from "@/modules/canvassing";

export const metadata: Metadata = {
  title: "Canvassing",
};

/**
 * The toolbar stays presentational: `GET /canvassing` accepts a `search` term,
 * but list search, sorting and filtering are not wired up yet. The status
 * options are the ones the backend actually derives; the department options are
 * still the mock reference list, since no canvassing row carries a department.
 */
const filters = [
  { label: "Status", options: [...canvassingStatusOptions] },
  { label: "Department", options: departments },
];

export default async function CanvassingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const activePage = Math.max(Number(page) || 1, 1);

  return (
    <>
      <PageHeader
        title="Canvassing"
        description="Items out for vendor quotation, grouped into batches"
      />

      <DataToolbar placeholder="Filter canvassing…" filters={filters} />

      <CanvassingListView page={activePage} />
    </>
  );
}
