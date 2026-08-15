import type { Metadata } from "next";

import { CanvassingListView } from "@/components/canvassing/canvassing-list-view";
import { DataToolbar } from "@/components/shared/data-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { canvassingStatusOptions } from "@/modules/canvassing";

export const metadata: Metadata = {
  title: "Canvassing",
};

/**
 * The toolbar stays presentational: `GET /canvassing` accepts a `search` term,
 * but list search, sorting and filtering are not wired up yet. Status is the
 * only filter offered — those options are the labels the backend derives. There
 * is no Department filter because a canvassing row carries no department, and a
 * placeholder list of names would filter against nothing.
 */
const filters = [{ label: "Status", options: [...canvassingStatusOptions] }];

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
